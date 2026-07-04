import type { SearchHit } from '../../src/shared/board'
import type { Org, OrgBoard, Project, ProjectHeader } from '../../src/store/types'
import { orgBoardRepo, orgRepo, projectRepo, searchRepo } from './repositories'

// ── Storage port (Ports & Adapters) ──────────────────────────────────────────
// The orchestrator (server/state.ts) talks only to this interface. Postgres is
// the sole adapter (Phase 5 removed the file-JSON store). Catalog = orgs + project
// headers (kept resident); full project boards load on demand via the registry.

export interface Catalog {
  orgs: Org[]
  headers: ProjectHeader[]
}

export interface Store {
  loadCatalog(): Promise<Catalog>
  loadProject(id: string): Promise<Project | null>
  saveProject(p: Project): Promise<void>
  insertOrg(o: Org): Promise<void>
  renameOrg(id: string, name: string): Promise<void>
  deleteOrg(id: string): Promise<void>
  renameProject(id: string, name: string): Promise<void>
  deleteProject(id: string): Promise<void>
  /** Org-level system maps — small documents, kept resident like the catalog. */
  loadOrgBoards(): Promise<OrgBoard[]>
  saveOrgBoard(b: OrgBoard): Promise<void>
  deleteOrgBoard(id: string): Promise<void>
  /** Memory recall across an org's boards (SQL over the search projection). */
  search(orgId: string, query: string, projectId?: string): Promise<SearchHit[]>
}

const pgStore: Store = {
  async loadCatalog() {
    const [orgs, headers] = await Promise.all([orgRepo.all(), projectRepo.headers()])
    return { orgs, headers }
  },
  loadProject: (id) => projectRepo.byId(id),
  async saveProject(p) {
    await projectRepo.save(p)
    // Read projection — kept eventually-consistent; failures are non-fatal.
    await searchRepo.reindex(p).catch((e) => console.error('search reindex failed:', e))
  },
  insertOrg: (o) => orgRepo.insert(o),
  renameOrg: (id, name) => orgRepo.rename(id, name),
  deleteOrg: (id) => orgRepo.delete(id),
  renameProject: (id, name) => projectRepo.rename(id, name),
  deleteProject: (id) => projectRepo.delete(id),
  loadOrgBoards: () => orgBoardRepo.all(),
  saveOrgBoard: (b) => orgBoardRepo.save(b),
  deleteOrgBoard: (id) => orgBoardRepo.delete(id),
  search: (orgId, query, projectId) => searchRepo.search(orgId, query, projectId),
}

export function getStore(): Store {
  return pgStore
}
