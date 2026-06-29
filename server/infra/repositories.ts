import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm'
import { requireDb } from './db'
import * as t from './schema'
import type { Org, Project } from '../../src/store/types'
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
export const projectRepo = {
  async all(): Promise<Project[]> {
    const rows = await requireDb().select().from(t.projects)
    return rows.map((r) => ({
      id: r.id,
      orgId: r.orgId,
      name: r.name,
      createdAt: iso(r.createdAt),
      data: r.data,
      snapshots: r.snapshots,
    }))
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
