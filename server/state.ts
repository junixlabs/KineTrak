import { applyCommand, type Command, type Root } from '../src/shared/board'
import type { Org, Project, ProjectHeader } from '../src/store/types'
import { recordChange, type Actor } from './activity'
import { isPgEnabled } from './infra/db'
import { getStore, type Catalog } from './infra/store'
import { searchRepo } from './infra/repositories'
import { ProjectRegistry } from './runtime/ProjectRegistry'
import { revokeOrgKeys } from './keys'
import { pruneShares } from './shares'

// ── Orchestrator (Phase 2: on-demand per-project) ────────────────────────────
// The catalog (orgs + project headers) stays resident for cheap listing/scoping;
// each project's heavy board loads on demand through the registry and is evicted
// when idle. Board commands go through the project aggregate (serialized writes);
// catalog commands (org/project lifecycle) mutate the resident catalog + store.

const store = getStore()
const registry = new ProjectRegistry(store)

let catalog: Catalog = { orgs: [], headers: [] }

/** What changed, so the broadcast layer can scope frames: one project's board,
 *  or the catalog (org/project lifecycle → clients resync their list). */
export type ChangeEvent = { kind: 'project'; project: Project } | { kind: 'catalog' }
const listeners = new Set<(e: ChangeEvent) => void>()

const header = (p: Project): ProjectHeader => ({ id: p.id, orgId: p.orgId, name: p.name, createdAt: p.createdAt })

/** Load the resident catalog from the store. Called once at boot (both modes). */
export async function hydrateState(): Promise<void> {
  catalog = await store.loadCatalog()
}

/** One-time backfill of the search projection for pre-existing projects (Pg only,
 *  runs only when the projection is empty — e.g. right after the migration). */
export async function backfillSearchIfEmpty(): Promise<void> {
  if (!isPgEnabled()) return
  if ((await searchRepo.count()) > 0) return
  for (const h of catalog.headers) {
    const p = await store.loadProject(h.id)
    if (p) await searchRepo.reindex(p)
  }
}

export function getCatalog(): Catalog {
  return catalog
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
  const projects = (await Promise.all(headers.map((h) => getProject(h.id)))).filter((p): p is Project => !!p)
  return { orgs, projects }
}

/** A single project's board, scoped to a share view ({orgs:[], projects:[p]}). */
export async function projectRoot(projectId: string): Promise<Root | null> {
  const p = await getProject(projectId)
  return p ? { orgs: [], projects: [p] } : null
}

// ── Mutations ──────────────────────────────────────────────────────────────────

const CATALOG_CMDS = new Set(['createOrg', 'renameOrg', 'deleteOrg', 'createProject', 'importProject', 'renameProject', 'deleteProject'])

/**
 * Apply a command, persist it durably, log the change, and notify listeners.
 * Board commands flow through the project aggregate; catalog commands mutate the
 * resident catalog + store.
 */
export async function applyAndBroadcast(cmd: Command, actor?: Actor): Promise<void> {
  let affected: Project | undefined

  if (CATALOG_CMDS.has(cmd.type)) {
    affected = await applyCatalog(cmd)
  } else {
    const pid = (cmd as { projectId?: string }).projectId
    const lp = pid ? await registry.acquire(pid) : null
    if (!lp) throw new Error('project not found')
    affected = await lp.apply(cmd)
  }

  recordChange(actor, cmd, affected)
  const event: ChangeEvent = CATALOG_CMDS.has(cmd.type) || !affected ? { kind: 'catalog' } : { kind: 'project', project: affected }
  listeners.forEach((l) => l(event))
}

async function applyCatalog(cmd: Command): Promise<Project | undefined> {
  switch (cmd.type) {
    case 'createOrg': {
      const org = applyCommand({ orgs: [], projects: [] }, cmd).orgs[0] as Org
      catalog.orgs.push(org)
      await store.insertOrg(org)
      return undefined
    }
    case 'renameOrg': {
      const o = catalog.orgs.find((x) => x.id === cmd.id)
      if (o) o.name = cmd.name
      await store.renameOrg(cmd.id, cmd.name)
      return undefined
    }
    case 'deleteOrg': {
      catalog.orgs = catalog.orgs.filter((o) => o.id !== cmd.id)
      const gone = catalog.headers.filter((h) => h.orgId === cmd.id)
      catalog.headers = catalog.headers.filter((h) => h.orgId !== cmd.id)
      gone.forEach((h) => registry.evict(h.id))
      await store.deleteOrg(cmd.id) // FK cascade in Pg
      revokeOrgKeys(cmd.id)
      pruneShares(new Set(catalog.headers.map((h) => h.id)))
      return undefined
    }
    case 'createProject':
    case 'importProject': {
      const project = applyCommand({ orgs: [], projects: [] }, cmd).projects[0]
      catalog.headers.push(header(project))
      registry.put(project)
      await store.saveProject(project)
      return project
    }
    case 'renameProject': {
      const h = catalog.headers.find((x) => x.id === cmd.id)
      if (h) h.name = cmd.name
      const lp = await registry.acquire(cmd.id)
      if (lp) lp.project = { ...lp.project, name: cmd.name }
      await store.renameProject(cmd.id, cmd.name)
      return undefined
    }
    case 'deleteProject': {
      catalog.headers = catalog.headers.filter((h) => h.id !== cmd.id)
      registry.evict(cmd.id)
      await store.deleteProject(cmd.id)
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
