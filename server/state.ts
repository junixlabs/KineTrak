import { applyCommand, type Command, type Root } from '../src/shared/board'
import type { Alert, Org, OrgBoard, Project, ProjectHeader } from '../src/shared/types'
import { recordChange, recordNote, type Actor } from './activity'
import { archiveAlert } from './questionLog'
import { getStore, type Catalog } from './infra/store'
import { searchRepo } from './infra/repositories'
import { ProjectRegistry } from './runtime/ProjectRegistry'
import { revokeOrgKeys } from './keys'
import { pruneShares } from './shares'
import { pruneOrgBoardShares } from './orgBoardShares'

// ── Orchestrator (Phase 2: on-demand per-project) ────────────────────────────
// The catalog (orgs + project headers) stays resident for cheap listing/scoping;
// each project's heavy board loads on demand through the registry and is evicted
// when idle. Board commands go through the project aggregate (serialized writes);
// catalog commands (org/project lifecycle) mutate the resident catalog + store.

const store = getStore()
const registry = new ProjectRegistry(store)

let catalog: Catalog = { orgs: [], headers: [] }
// Org-level system maps — small documents, resident like the catalog.
let orgBoards: OrgBoard[] = []

/** What changed, so the broadcast layer can scope frames: one project's board,
 *  one org board, or the catalog (org/project lifecycle → clients resync). */
export type ChangeEvent = { kind: 'project'; project: Project } | { kind: 'catalog' } | { kind: 'orgboard'; board: OrgBoard }
const listeners = new Set<(e: ChangeEvent) => void>()

const header = (p: Project): ProjectHeader => ({ id: p.id, orgId: p.orgId, name: p.name, createdAt: p.createdAt })

/** Load the resident catalog from the store. Called once at boot (both modes). */
export async function hydrateState(): Promise<void> {
  ;[catalog, orgBoards] = await Promise.all([store.loadCatalog(), store.loadOrgBoards()])
}

/** One-time backfill of the search projection for pre-existing projects (runs
 *  only when the projection is empty — e.g. right after the migration). */
export async function backfillSearchIfEmpty(): Promise<void> {
  if ((await searchRepo.count()) > 0) return
  for (const h of catalog.headers) {
    const p = await store.loadProject(h.id)
    if (p) await searchRepo.reindex(p)
  }
}

export function getCatalog(): Catalog {
  return catalog
}

export function getOrgBoards(orgId?: string): OrgBoard[] {
  return orgId ? orgBoards.filter((b) => b.orgId === orgId) : orgBoards
}

export function orgBoardOrgId(boardId: string): string | undefined {
  return orgBoards.find((b) => b.id === boardId)?.orgId
}

/** The live board for a project, loaded on demand. null if it doesn't exist. */
export async function getProject(id: string): Promise<Project | null> {
  const lp = await registry.acquire(id)
  return lp?.project ?? null
}

export function projectHeader(id: string): ProjectHeader | undefined {
  return catalog.headers.find((h) => h.id === id)
}

export function projectOrgId(id: string): string | undefined {
  return catalog.headers.find((h) => h.id === id)?.orgId
}

export function residentProjectCount(): number {
  return registry.residentCount()
}

/** Memory recall across one org's boards (no board loaded in Pg mode). */
export function searchOrg(orgId: string, query: string, projectId?: string) {
  return store.search(orgId, query, projectId)
}

// ── Scoped views ──────────────────────────────────────────────────────────────

/** Catalog scoped to a user's owned orgs (sync — headers only). */
export function scopeCatalogForUser(userId: string): Catalog {
  const orgs = catalog.orgs.filter((o) => o.ownerId === userId)
  const own = new Set(orgs.map((o) => o.id))
  return { orgs, headers: catalog.headers.filter((h) => own.has(h.orgId)) }
}

/** Full board for a user (loads each owned project on demand). Bridge for the
 *  current whole-root web client + WS; Phase 3 replaces this with per-project rooms. */
export async function scopedRootForUser(userId: string): Promise<Root> {
  const { orgs, headers } = scopeCatalogForUser(userId)
  const own = new Set(orgs.map((o) => o.id))
  const projects = (await Promise.all(headers.map((h) => getProject(h.id)))).filter((p): p is Project => !!p)
  return { orgs, projects, orgBoards: orgBoards.filter((b) => own.has(b.orgId)) }
}

/** A single project's board, scoped to a share view ({orgs:[], projects:[p]}). */
export async function projectRoot(projectId: string): Promise<Root | null> {
  const p = await getProject(projectId)
  return p ? { orgs: [], projects: [p] } : null
}

// ── Mutations ──────────────────────────────────────────────────────────────────

const CATALOG_CMDS = new Set(['createOrg', 'renameOrg', 'deleteOrg', 'createProject', 'importProject', 'renameProject', 'deleteProject'])
const ORG_BOARD_CMDS = new Set([
  'createOrgBoard', 'renameOrgBoard', 'deleteOrgBoard',
  'addOrgBoardNode', 'updateOrgBoardNode', 'deleteOrgBoardNode',
  'addOrgBoardEdge', 'updateOrgBoardEdge', 'deleteOrgBoardEdge',
  'linkOrgEdgeCode', 'markOrgEdgeStale',
])

/**
 * Apply a command, persist it durably, log the change, and notify listeners.
 * Board commands flow through the project aggregate; catalog commands mutate the
 * resident catalog + store; org-board commands mutate the resident maps + store.
 */
export async function applyAndBroadcast(cmd: Command, actor?: Actor): Promise<void> {
  let affected: Project | undefined
  let orgBoard: OrgBoard | undefined
  let preAlerts: Alert[] | undefined

  if (CATALOG_CMDS.has(cmd.type)) {
    affected = await applyCatalog(cmd)
  } else if (ORG_BOARD_CMDS.has(cmd.type)) {
    // Capture the pre-state so delete notes can still resolve node/project names.
    const boardId = (cmd as { boardId?: string; id?: string }).boardId ?? (cmd as { id?: string }).id
    const prevBoard = orgBoards.find((b) => b.id === boardId)
    orgBoard = await applyOrgBoard(cmd)
    // Resolve names from the PRE-state so deletes still see their node/edge.
    if (actor) noteOrgBoardChange(cmd, prevBoard, actor)
  } else {
    const pid = (cmd as { projectId?: string }).projectId
    const lp = pid ? await registry.acquire(pid) : null
    if (!lp) throw new Error('project not found')
    // cm:why the PRE-state alerts are captured here, before apply: a dismissal is the last moment
    // an alert raised before the archive existed can still be read off the board.
    if (cmd.type === 'resolveQuestion') preAlerts = lp.project.data.alerts
    affected = await lp.apply(cmd)
  }

  recordChange(actor, cmd, affected)
  // cm:edge lockstep -> server/questionLog.ts — archived at CREATE time so resolve_question's
  // destructive filter in the pure reducer stays as it is and a dismissal loses nothing.
  archiveAlert(cmd, { orgId: affected?.orgId, alerts: preAlerts })
  const event: ChangeEvent = ORG_BOARD_CMDS.has(cmd.type)
    ? orgBoard
      ? { kind: 'orgboard', board: orgBoard }
      : { kind: 'catalog' } // org-board delete → clients resync the whole scoped root
    : CATALOG_CMDS.has(cmd.type) || !affected
      ? { kind: 'catalog' }
      : { kind: 'project', project: affected }
  listeners.forEach((l) => l(event))
}

// Same durable-write-first invariant as applyCatalog: persist, then swap the
// resident array — a failed write leaves nothing observable.
// Returns the post-state board (undefined for deletes).
async function applyOrgBoard(cmd: Command): Promise<OrgBoard | undefined> {
  const next = applyCommand({ orgs: [], projects: [], orgBoards }, cmd).orgBoards ?? []
  let changed: OrgBoard | undefined
  if (cmd.type === 'deleteOrgBoard') {
    await store.deleteOrgBoard(cmd.id)
  } else {
    const boardId = (cmd as { boardId?: string; id?: string }).boardId ?? (cmd as { id?: string }).id
    const found = next.find((b) => b.id === boardId)
    if (!found) throw new Error('org board not found')
    if (cmd.type === 'createOrgBoard' && !catalog.orgs.some((o) => o.id === found.orgId)) throw new Error('org not found')
    await store.saveOrgBoard(found)
    changed = found
  }
  orgBoards = next
  if (cmd.type === 'deleteOrgBoard') pruneOrgBoardShares(new Set(orgBoards.map((b) => b.id)))
  return changed
}

/** Narrate an org-board mutation into the activity feeds of the endpoint
 *  projects it touches. The activity pipeline stays project-scoped (its table,
 *  ring and cursors are keyed by projectId) — an org-board edit is simply a
 *  note in each affected project's story. Mutations touching no project node
 *  are skipped; webhook-driven staleness carries its own richer note. */
function noteOrgBoardChange(cmd: Command, board: OrgBoard | undefined, actor: Actor): void {
  if (!board) return
  const node = (id: string) => board.nodes.find((n) => n.id === id)
  const edgeName = (from: string, to: string) => {
    const e = board.edges.find((x) => x.from === from && x.to === to)
    return e?.label || `${node(from)?.label ?? '?'} → ${node(to)?.label ?? '?'}`
  }
  const notes: { projectId: string; summary: string }[] = []
  const forEdge = (from: string, to: string, summary: string) => {
    for (const pid of new Set([node(from)?.projectId, node(to)?.projectId]))
      if (pid) notes.push({ projectId: pid, summary })
  }
  switch (cmd.type) {
    case 'addOrgBoardEdge':
      forEdge(cmd.from, cmd.to, `connected an integration “${edgeName(cmd.from, cmd.to)}” on org board “${board.name}”`)
      break
    case 'updateOrgBoardEdge': {
      const what = 'desc' in cmd.patch ? 'contract of' : 'fromFeatureId' in cmd.patch || 'toFeatureId' in cmd.patch ? 'anchors of' : ''
      forEdge(cmd.from, cmd.to, `updated ${what ? `the ${what} ` : ''}integration “${edgeName(cmd.from, cmd.to)}” on org board “${board.name}”`)
      break
    }
    case 'deleteOrgBoardEdge':
      forEdge(cmd.from, cmd.to, `removed an integration on org board “${board.name}”`)
      break
    case 'linkOrgEdgeCode':
      forEdge(cmd.from, cmd.to, `${cmd.op === 'unlink' ? 'unlinked code from' : 'linked code to'} integration “${edgeName(cmd.from, cmd.to)}” (${cmd.ref.path})`)
      break
    case 'markOrgEdgeStale':
      // stale:true comes from the webhook, which writes its own richer note.
      if (!cmd.stale) for (const e of cmd.edges) forEdge(e.from, e.to, `reconciled integration “${edgeName(e.from, e.to)}” on org board “${board.name}”`)
      break
    case 'addOrgBoardNode':
    case 'updateOrgBoardNode':
    case 'deleteOrgBoardNode': {
      // A just-added node is not in the pre-state board — its project rides on the command.
      const pid = cmd.type === 'addOrgBoardNode' ? cmd.projectId : node(cmd.id)?.projectId
      if (pid)
        notes.push({
          projectId: pid,
          summary: `${cmd.type === 'addOrgBoardNode' ? 'added this project to' : cmd.type === 'deleteOrgBoardNode' ? 'removed this project from' : 'updated this project’s system on'} org board “${board.name}”`,
        })
      break
    }
    default:
      break // board create/rename/delete carry no project anchor
  }
  const seen = new Set<string>()
  for (const { projectId, summary } of notes) {
    const key = `${projectId}:${summary}`
    if (seen.has(key)) continue
    seen.add(key)
    if (catalog.headers.some((h) => h.id === projectId)) recordNote(projectId, actor, summary)
  }
}

// Invariant: persist to the store FIRST, then update the resident catalog /
// registry. A failed durable write therefore leaves no orphan header or
// resident aggregate — the command throws and nothing is observable.
async function applyCatalog(cmd: Command): Promise<Project | undefined> {
  switch (cmd.type) {
    case 'createOrg': {
      const org = applyCommand({ orgs: [], projects: [] }, cmd).orgs[0] as Org
      await store.insertOrg(org)
      catalog.orgs.push(org)
      return undefined
    }
    case 'renameOrg': {
      await store.renameOrg(cmd.id, cmd.name)
      const o = catalog.orgs.find((x) => x.id === cmd.id)
      if (o) o.name = cmd.name
      return undefined
    }
    case 'deleteOrg': {
      await store.deleteOrg(cmd.id) // FK cascade removes projects/org_boards/keys/shares/activity
      orgBoards = orgBoards.filter((b) => b.orgId !== cmd.id)
      catalog.orgs = catalog.orgs.filter((o) => o.id !== cmd.id)
      catalog.headers
        .filter((h) => h.orgId === cmd.id)
        .forEach((h) => registry.evict(h.id))
      catalog.headers = catalog.headers.filter((h) => h.orgId !== cmd.id)
      revokeOrgKeys(cmd.id)
      pruneShares(new Set(catalog.headers.map((h) => h.id)))
      pruneOrgBoardShares(new Set(orgBoards.map((b) => b.id)))
      return undefined
    }
    case 'createProject':
    case 'importProject': {
      const project = applyCommand({ orgs: [], projects: [] }, cmd).projects[0]
      await store.saveProject(project)
      catalog.headers.push(header(project))
      registry.put(project)
      return project
    }
    case 'renameProject': {
      await store.renameProject(cmd.id, cmd.name)
      const h = catalog.headers.find((x) => x.id === cmd.id)
      if (h) h.name = cmd.name
      // Keep a resident aggregate's copy in sync; don't force-load just to rename.
      const lp = registry.peek(cmd.id)
      if (lp) lp.project = { ...lp.project, name: cmd.name }
      return undefined
    }
    case 'deleteProject': {
      await store.deleteProject(cmd.id)
      catalog.headers = catalog.headers.filter((h) => h.id !== cmd.id)
      registry.evict(cmd.id)
      pruneShares(new Set(catalog.headers.map((h) => h.id)))
      return undefined
    }
    default:
      return undefined
  }
}

export function onChange(fn: (e: ChangeEvent) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
