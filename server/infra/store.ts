import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { searchBoard, type Root, type SearchHit } from '../../src/shared/board'
import type { Org, Project, ProjectHeader } from '../../src/store/types'
import { isPgEnabled } from './db'
import { orgRepo, projectRepo, searchRepo } from './repositories'

// ── Storage port (Ports & Adapters) ──────────────────────────────────────────
// The orchestrator (server/state.ts) talks only to this interface. Two adapters:
// PgStore (per-row Postgres) and FileStore (one JSON blob, legacy/local-first).
// Catalog = orgs + project headers (kept resident); full project board loads on
// demand via the registry.

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
  /** Memory recall across an org's boards (Pg: projection; File: in-RAM scan). */
  search(orgId: string, query: string, projectId?: string): Promise<SearchHit[]>
}

// ── Postgres adapter ─────────────────────────────────────────────────────────
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
  search: (orgId, query, projectId) => searchRepo.search(orgId, query, projectId),
}

// ── File adapter (whole board.json blob held in RAM) ─────────────────────────
const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, '..', 'data')
const FILE = join(DATA_DIR, 'board.json')

function makeFileStore(): Store {
  let root: Root = loadFile()
  let timer: ReturnType<typeof setTimeout> | null = null

  function loadFile(): Root {
    if (existsSync(FILE)) {
      try {
        const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
        if (Array.isArray(parsed?.orgs) && Array.isArray(parsed?.projects)) return parsed
      } catch {
        /* fall through */
      }
    }
    return { orgs: [], projects: [] }
  }
  function persist() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      mkdirSync(DATA_DIR, { recursive: true })
      writeFileSync(FILE, JSON.stringify(root, null, 2))
    }, 150)
  }
  const header = (p: Project): ProjectHeader => ({ id: p.id, orgId: p.orgId, name: p.name, createdAt: p.createdAt })

  return {
    async loadCatalog() {
      return { orgs: root.orgs, headers: root.projects.map(header) }
    },
    async loadProject(id) {
      return root.projects.find((p) => p.id === id) ?? null
    },
    async saveProject(p) {
      const i = root.projects.findIndex((x) => x.id === p.id)
      if (i >= 0) root.projects[i] = p
      else root.projects.push(p)
      persist()
    },
    async insertOrg(o) {
      if (!root.orgs.some((x) => x.id === o.id)) root.orgs.push(o)
      persist()
    },
    async renameOrg(id, name) {
      const o = root.orgs.find((x) => x.id === id)
      if (o) o.name = name
      persist()
    },
    async deleteOrg(id) {
      root = { orgs: root.orgs.filter((o) => o.id !== id), projects: root.projects.filter((p) => p.orgId !== id) }
      persist()
    },
    async renameProject(id, name) {
      const p = root.projects.find((x) => x.id === id)
      if (p) p.name = name
      persist()
    },
    async deleteProject(id) {
      root.projects = root.projects.filter((p) => p.id !== id)
      persist()
    },
    async search(orgId, query, projectId) {
      const projects = root.projects.filter((p) => p.orgId === orgId)
      return searchBoard({ orgs: [], projects }, query, projectId)
    },
  }
}

let cached: Store | null = null
export function getStore(): Store {
  if (!cached) cached = isPgEnabled() ? pgStore : makeFileStore()
  return cached
}
