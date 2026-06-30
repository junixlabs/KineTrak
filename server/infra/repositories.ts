import { and, asc, eq, gt, ilike, inArray, or, sql } from 'drizzle-orm'
import { requireDb } from './db'
import * as t from './schema'
import type { SearchHit } from '../../src/shared/board'
import type { Org, Project, ProjectHeader } from '../../src/store/types'
import type { User } from '../auth'
import type { ApiKey } from '../keys'
import type { Share } from '../shares'
import type { Activity } from '../activity'

// ── Drizzle-backed repositories (the Postgres adapter) ───────────────────────
// Each repo maps between the domain shapes used across the server and the
// relational tables. Domain timestamps stay in their existing form (ISO strings
// for created_at, epoch-ms numbers for sessions/activity) and are converted at
// this boundary. Reads here are only used at boot to hydrate the in-RAM caches;
// the hot read path stays synchronous against RAM (Phase 1).

const iso = (d: Date | null | undefined): string => (d ? d.toISOString() : new Date(0).toISOString())

// ── Users ────────────────────────────────────────────────────────────────────
export const userRepo = {
  async all(): Promise<User[]> {
    const rows = await requireDb().select().from(t.users)
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      salt: r.salt,
      hash: r.hash,
      role: r.role,
      createdAt: iso(r.createdAt),
    }))
  },
  async insert(u: User): Promise<void> {
    await requireDb()
      .insert(t.users)
      .values({ id: u.id, email: u.email, name: u.name, salt: u.salt, hash: u.hash, role: u.role, createdAt: new Date(u.createdAt) })
  },
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export interface SessionRow {
  token: string
  userId: string
  expiresAt: number
}
export const sessionRepo = {
  async all(): Promise<SessionRow[]> {
    const rows = await requireDb().select().from(t.sessions)
    return rows.map((r) => ({ token: r.token, userId: r.userId, expiresAt: r.expiresAt.getTime() }))
  },
  async insert(s: SessionRow): Promise<void> {
    await requireDb().insert(t.sessions).values({ token: s.token, userId: s.userId, expiresAt: new Date(s.expiresAt) })
  },
  async delete(token: string): Promise<void> {
    await requireDb().delete(t.sessions).where(eq(t.sessions.token, token))
  },
  async deleteMany(tokens: string[]): Promise<void> {
    if (!tokens.length) return
    await requireDb().delete(t.sessions).where(inArray(t.sessions.token, tokens))
  },
}

// ── Orgs ─────────────────────────────────────────────────────────────────────
export const orgRepo = {
  async all(): Promise<Org[]> {
    const rows = await requireDb().select().from(t.orgs)
    return rows.map((r) => ({ id: r.id, name: r.name, ownerId: r.ownerId }))
  },
  async insert(o: Org): Promise<void> {
    await requireDb()
      .insert(t.orgs)
      .values({ id: o.id, name: o.name, ownerId: o.ownerId ?? '' })
      .onConflictDoUpdate({ target: t.orgs.id, set: { name: o.name } })
  },
  async rename(id: string, name: string): Promise<void> {
    await requireDb().update(t.orgs).set({ name }).where(eq(t.orgs.id, id))
  },
  async delete(id: string): Promise<void> {
    // Projects, api_keys, shares, activity cascade via FKs.
    await requireDb().delete(t.orgs).where(eq(t.orgs.id, id))
  },
}

// ── Projects (catalog header + board JSONB) ──────────────────────────────────
const toProject = (r: typeof t.projects.$inferSelect): Project => ({
  id: r.id,
  orgId: r.orgId,
  name: r.name,
  createdAt: iso(r.createdAt),
  data: r.data,
  snapshots: r.snapshots,
})

export const projectRepo = {
  async all(): Promise<Project[]> {
    const rows = await requireDb().select().from(t.projects)
    return rows.map(toProject)
  },
  /** Catalog view — headers only, no heavy board payload (Phase 2 on-demand). */
  async headers(): Promise<ProjectHeader[]> {
    const rows = await requireDb()
      .select({ id: t.projects.id, orgId: t.projects.orgId, name: t.projects.name, createdAt: t.projects.createdAt })
      .from(t.projects)
    return rows.map((r) => ({ id: r.id, orgId: r.orgId, name: r.name, createdAt: iso(r.createdAt) }))
  },
  async byId(id: string): Promise<Project | null> {
    const rows = await requireDb().select().from(t.projects).where(eq(t.projects.id, id)).limit(1)
    return rows[0] ? toProject(rows[0]) : null
  },
  /** Insert or overwrite a project's full state (header + board + snapshots). */
  async save(p: Project): Promise<void> {
    await requireDb()
      .insert(t.projects)
      .values({ id: p.id, orgId: p.orgId, name: p.name, createdAt: new Date(p.createdAt), data: p.data, snapshots: p.snapshots })
      .onConflictDoUpdate({
        target: t.projects.id,
        set: { name: p.name, data: p.data, snapshots: p.snapshots, version: sqlIncrementVersion() },
      })
  },
  async rename(id: string, name: string): Promise<void> {
    await requireDb().update(t.projects).set({ name }).where(eq(t.projects.id, id))
  },
  async delete(id: string): Promise<void> {
    await requireDb().delete(t.projects).where(eq(t.projects.id, id))
  },
}

// version = version + 1 on every board write (optimistic-concurrency groundwork).
function sqlIncrementVersion() {
  return sql`${t.projects.version} + 1`
}

// ── API keys (hashed at rest) ────────────────────────────────────────────────
export interface KeyRow {
  id: string
  userId: string
  orgId: string
  name: string
  keyHash: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
}
export const keyRepo = {
  async all(): Promise<KeyRow[]> {
    const rows = await requireDb().select().from(t.apiKeys)
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      orgId: r.orgId,
      name: r.name,
      keyHash: r.keyHash,
      keyPrefix: r.keyPrefix,
      createdAt: iso(r.createdAt),
      lastUsedAt: r.lastUsedAt ? iso(r.lastUsedAt) : null,
    }))
  },
  async insert(k: KeyRow): Promise<void> {
    await requireDb().insert(t.apiKeys).values({
      id: k.id,
      userId: k.userId,
      orgId: k.orgId,
      name: k.name,
      keyHash: k.keyHash,
      keyPrefix: k.keyPrefix,
      createdAt: new Date(k.createdAt),
      lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt) : null,
    })
  },
  async delete(id: string): Promise<void> {
    await requireDb().delete(t.apiKeys).where(eq(t.apiKeys.id, id))
  },
  async touch(id: string, at: string): Promise<void> {
    await requireDb().update(t.apiKeys).set({ lastUsedAt: new Date(at) }).where(eq(t.apiKeys.id, id))
  },
}

// ── Shares ───────────────────────────────────────────────────────────────────
export const shareRepo = {
  async all(): Promise<Share[]> {
    const rows = await requireDb().select().from(t.shares)
    return rows.map((r) => ({ token: r.token, projectId: r.projectId, createdAt: iso(r.createdAt) }))
  },
  async insert(s: Share): Promise<void> {
    await requireDb().insert(t.shares).values({ token: s.token, projectId: s.projectId, createdAt: new Date(s.createdAt) })
  },
  async deleteByProject(projectId: string): Promise<void> {
    await requireDb().delete(t.shares).where(eq(t.shares.projectId, projectId))
  },
}

// ── Activity (append-only) ───────────────────────────────────────────────────
export const activityRepo = {
  /** Most recent entries (any project), newest last — used to warm the RAM ring. */
  async recent(limit = 1000): Promise<Activity[]> {
    const rows = await requireDb().select().from(t.activity).orderBy(asc(t.activity.id)).limit(limit)
    return rows.map(rowToActivity)
  },
  async insert(a: Activity): Promise<void> {
    await requireDb().insert(t.activity).values({
      projectId: a.projectId,
      ts: new Date(a.ts),
      actor: a.actor,
      summary: a.summary,
      targetId: a.targetId,
      kind: a.kind,
    })
  },
  /** Cursor read for get_changes_since (DB-native; Phase 2+). */
  async since(projectId: string, sinceId = 0, limit = 200): Promise<Activity[]> {
    const rows = await requireDb()
      .select()
      .from(t.activity)
      .where(and(eq(t.activity.projectId, projectId), gt(t.activity.id, sinceId)))
      .orderBy(asc(t.activity.id))
      .limit(limit)
    return rows.map(rowToActivity)
  },
}

// ── Search projection (read model) ───────────────────────────────────────────
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n) : s)
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ')

/** Flatten a project's board into searchable rows (mirrors searchBoard's text). */
export function searchRows(p: Project): { projectId: string; kind: 'module' | 'feature' | 'swimnode'; itemId: string; label: string; text: string }[] {
  const d = p.data
  const rows: { projectId: string; kind: 'module' | 'feature' | 'swimnode'; itemId: string; label: string; text: string }[] = []
  for (const m of d.modules) rows.push({ projectId: p.id, kind: 'module', itemId: m.id, label: m.name, text: join(m.name, m.backbone.name, m.backbone.sub) })
  for (const f of d.features) rows.push({ projectId: p.id, kind: 'feature', itemId: f.id, label: f.name, text: join(f.name, f.desc, ...(f.constraints ?? []), ...(f.validations ?? [])) })
  for (const n of d.swimNodes) rows.push({ projectId: p.id, kind: 'swimnode', itemId: n.id, label: n.label, text: join(n.label, n.desc, n.owner, ...(n.constraints ?? [])) })
  return rows
}

export const searchRepo = {
  /** Total projection rows — 0 means it needs a one-time backfill. */
  async count(): Promise<number> {
    const r = await requireDb().select({ n: sql<number>`count(*)::int` }).from(t.searchItems)
    return r[0]?.n ?? 0
  },
  /** Rebuild the search rows for one project (delete + insert). */
  async reindex(p: Project): Promise<void> {
    const db = requireDb()
    await db.delete(t.searchItems).where(eq(t.searchItems.projectId, p.id))
    const rows = searchRows(p)
    if (rows.length) await db.insert(t.searchItems).values(rows)
  },
  /** Search an org's projects via the projection (no board loaded). */
  async search(orgId: string, query: string, projectId?: string): Promise<SearchHit[]> {
    const q = query.trim()
    if (!q) return []
    const like = `%${q}%`
    const where = and(
      eq(t.projects.orgId, orgId),
      projectId ? eq(t.searchItems.projectId, projectId) : undefined,
      or(ilike(t.searchItems.label, like), ilike(t.searchItems.text, like)),
    )
    const rows = await requireDb()
      .select({ projectId: t.searchItems.projectId, kind: t.searchItems.kind, itemId: t.searchItems.itemId, label: t.searchItems.label, text: t.searchItems.text })
      .from(t.searchItems)
      .innerJoin(t.projects, eq(t.searchItems.projectId, t.projects.id))
      .where(where)
      .limit(100)
    return rows.map((r) => ({ projectId: r.projectId, kind: r.kind, id: r.itemId, label: r.label, snippet: clip(r.text) }))
  },
}

function rowToActivity(r: typeof t.activity.$inferSelect): Activity {
  return {
    id: String(r.id),
    projectId: r.projectId,
    ts: r.ts.getTime(),
    actor: r.actor,
    summary: r.summary,
    targetId: r.targetId ?? undefined,
    kind: r.kind,
  }
}
