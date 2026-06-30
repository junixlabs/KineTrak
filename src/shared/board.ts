// Pure board command reducer shared by the client store, the server, and MCP tools.
// Applying the same Command on any of them yields identical state, because the
// originator mints all ids/timestamps and passes them inside the command.
//
// Uses only relative imports + Node-safe helpers (crypto.randomUUID / structuredClone)
// so it runs unchanged under both Vite and tsx.
import type {
  Feature,
  Module,
  NodeKind,
  Org,
  Project,
  ProjectTemplate,
  Snapshot,
  SwimNode,
  WorkspaceData,
  WorkspaceSettings,
} from '../store/types'
import { templateData, cloneData } from '../store/seed'

export interface Root {
  orgs: Org[]
  projects: Project[]
}

export const MODULE_PALETTE = ['#2f6fed', '#0d9488', '#7c5cff', '#f59e0b', '#16a34a', '#e5484d', '#6e8bff']

export type Command =
  | { type: 'createOrg'; id: string; name: string; ownerId?: string }
  | { type: 'renameOrg'; id: string; name: string }
  | { type: 'deleteOrg'; id: string }
  | { type: 'createProject'; id: string; orgId: string; name: string; template: ProjectTemplate; createdAt: string }
  | { type: 'importProject'; id: string; orgId: string; name: string; createdAt: string; data: WorkspaceData; snapshots?: Snapshot[] }
  | { type: 'renameProject'; id: string; name: string }
  | { type: 'deleteProject'; id: string }
  | { type: 'addModule'; projectId: string; id: string; name?: string; color?: string }
  | { type: 'updateModule'; projectId: string; id: string; patch: Partial<Module> }
  | { type: 'deleteModule'; projectId: string; id: string }
  | { type: 'addFeature'; projectId: string; id: string; moduleId: string; releaseId: string; name?: string }
  | { type: 'updateFeature'; projectId: string; id: string; patch: Partial<Feature> }
  | { type: 'deleteFeature'; projectId: string; id: string }
  | { type: 'addSwimNode'; projectId: string; id: string; code: string; lane: number; x: number; y: number; label?: string; kind?: NodeKind }
  | { type: 'updateSwimNode'; projectId: string; id: string; patch: Partial<SwimNode> }
  | { type: 'updateSwimNodePos'; projectId: string; id: string; x: number; y: number }
  | { type: 'deleteSwimNode'; projectId: string; id: string }
  | { type: 'addSwimEdge'; projectId: string; from: string; to: string; branch?: string }
  | { type: 'deleteSwimEdge'; projectId: string; from: string; to: string }
  | { type: 'reorderModules'; projectId: string; orderedIds: string[] }
  | { type: 'reorderFeatures'; projectId: string; orderedIds: string[] }
  | { type: 'createSnapshot'; projectId: string; id: string; name: string; date: string }
  | { type: 'deleteSnapshot'; projectId: string; id: string }
  | { type: 'appendNote'; projectId: string; target: 'feature' | 'swimnode'; id: string; text: string }
  | { type: 'updateSettings'; projectId: string; patch: Partial<WorkspaceSettings> }

const mapData = (root: Root, projectId: string, fn: (d: WorkspaceData) => WorkspaceData): Root => ({
  ...root,
  projects: root.projects.map((p) => (p.id === projectId ? { ...p, data: fn(p.data) } : p)),
})

const mapProject = (root: Root, projectId: string, fn: (p: Project) => Project): Root => ({
  ...root,
  projects: root.projects.map((p) => (p.id === projectId ? fn(p) : p)),
})

export function applyCommand(root: Root, cmd: Command): Root {
  switch (cmd.type) {
    case 'createOrg':
      return { ...root, orgs: [...root.orgs, { id: cmd.id, name: cmd.name.trim() || 'New org', ...(cmd.ownerId ? { ownerId: cmd.ownerId } : {}) }] }
    case 'renameOrg':
      return { ...root, orgs: root.orgs.map((o) => (o.id === cmd.id ? { ...o, name: cmd.name } : o)) }
    case 'deleteOrg':
      return { orgs: root.orgs.filter((o) => o.id !== cmd.id), projects: root.projects.filter((p) => p.orgId !== cmd.id) }

    case 'createProject': {
      const proj: Project = {
        id: cmd.id,
        orgId: cmd.orgId,
        name: cmd.name.trim() || 'New project',
        createdAt: cmd.createdAt,
        data: templateData(cmd.template),
        snapshots: [],
      }
      return { ...root, projects: [...root.projects, proj] }
    }
    case 'importProject': {
      const proj: Project = {
        id: cmd.id,
        orgId: cmd.orgId,
        name: cmd.name.trim() || 'Imported project',
        createdAt: cmd.createdAt,
        data: cloneData(cmd.data),
        snapshots: cmd.snapshots ?? [],
      }
      return { ...root, projects: [...root.projects, proj] }
    }
    case 'renameProject':
      return { ...root, projects: root.projects.map((p) => (p.id === cmd.id ? { ...p, name: cmd.name } : p)) }
    case 'deleteProject':
      return { ...root, projects: root.projects.filter((p) => p.id !== cmd.id) }

    case 'addModule':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        modules: [
          ...d.modules,
          {
            id: cmd.id,
            name: cmd.name ?? 'New module',
            color: cmd.color ?? MODULE_PALETTE[d.modules.length % MODULE_PALETTE.length],
            // Default the Story Map column to the module's name (not a generic "New step").
            backbone: { name: cmd.name?.trim() || 'New module', sub: '' },
            owners: [],
          },
        ],
      }))
    case 'updateModule':
      return mapData(root, cmd.projectId, (d) => ({ ...d, modules: d.modules.map((m) => (m.id === cmd.id ? { ...m, ...cmd.patch } : m)) }))
    case 'deleteModule':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        modules: d.modules.filter((m) => m.id !== cmd.id),
        features: d.features.filter((f) => f.moduleId !== cmd.id),
      }))

    case 'addFeature':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        features: [...d.features, { id: cmd.id, moduleId: cmd.moduleId, releaseId: cmd.releaseId, name: cmd.name ?? 'New feature', status: 'progress' }],
      }))
    case 'updateFeature':
      return mapData(root, cmd.projectId, (d) => ({ ...d, features: d.features.map((f) => (f.id === cmd.id ? { ...f, ...cmd.patch } : f)) }))
    case 'deleteFeature':
      return mapData(root, cmd.projectId, (d) => ({ ...d, features: d.features.filter((f) => f.id !== cmd.id) }))

    case 'addSwimNode':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        swimNodes: [...d.swimNodes, { id: cmd.id, code: cmd.code, label: cmd.label ?? 'New step', lane: cmd.lane, kind: cmd.kind ?? 'process', status: 'todo', x: cmd.x, y: cmd.y }],
      }))
    case 'updateSwimNode':
      return mapData(root, cmd.projectId, (d) => ({ ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? { ...n, ...cmd.patch } : n)) }))
    case 'updateSwimNodePos':
      return mapData(root, cmd.projectId, (d) => ({ ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? { ...n, x: cmd.x, y: cmd.y } : n)) }))
    case 'deleteSwimNode':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        swimNodes: d.swimNodes.filter((n) => n.id !== cmd.id),
        swimEdges: d.swimEdges.filter((e) => e.from !== cmd.id && e.to !== cmd.id),
      }))
    case 'addSwimEdge':
      if (cmd.from === cmd.to) return root
      return mapData(root, cmd.projectId, (d) =>
        d.swimEdges.some((e) => e.from === cmd.from && e.to === cmd.to)
          ? d
          : { ...d, swimEdges: [...d.swimEdges, { from: cmd.from, to: cmd.to, ...(cmd.branch ? { branch: cmd.branch } : {}) }] },
      )
    case 'deleteSwimEdge':
      return mapData(root, cmd.projectId, (d) => ({ ...d, swimEdges: d.swimEdges.filter((e) => !(e.from === cmd.from && e.to === cmd.to)) }))

    case 'reorderModules':
      return mapData(root, cmd.projectId, (d) => {
        const set = new Set(cmd.orderedIds)
        const listed = cmd.orderedIds.map((id) => d.modules.find((m) => m.id === id)).filter(Boolean) as Module[]
        return { ...d, modules: [...listed, ...d.modules.filter((m) => !set.has(m.id))] }
      })
    case 'reorderFeatures':
      return mapData(root, cmd.projectId, (d) => {
        const set = new Set(cmd.orderedIds)
        const listed = cmd.orderedIds.map((id) => d.features.find((f) => f.id === id)).filter(Boolean) as Feature[]
        return { ...d, features: [...listed, ...d.features.filter((f) => !set.has(f.id))] }
      })
    case 'createSnapshot':
      return mapProject(root, cmd.projectId, (p) => {
        const snap: Snapshot = {
          id: cmd.id,
          name: cmd.name.trim() || 'Snapshot',
          date: cmd.date,
          tag: 'SNAP',
          tagColor: '#2f6fed',
          tagBg: '#e9f1ff',
          dot: '#2f6fed',
          data: cloneData(p.data),
        }
        return { ...p, snapshots: [snap, ...p.snapshots] }
      })
    case 'deleteSnapshot':
      return mapProject(root, cmd.projectId, (p) => ({ ...p, snapshots: p.snapshots.filter((s) => s.id !== cmd.id) }))

    case 'appendNote':
      return mapData(root, cmd.projectId, (d) => {
        const join = (cur: string | undefined) => (cur ? `${cur}\n${cmd.text}` : cmd.text)
        return cmd.target === 'feature'
          ? { ...d, features: d.features.map((f) => (f.id === cmd.id ? { ...f, desc: join(f.desc) } : f)) }
          : { ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? { ...n, desc: join(n.desc) } : n)) }
      })

    case 'updateSettings':
      return mapData(root, cmd.projectId, (d) => ({ ...d, settings: { ...d.settings, ...cmd.patch } }))

    default:
      return root
  }
}

// ── Read helpers (used by MCP read/search tools) ─────────────────────────────

export function findProject(root: Root, projectId?: string): Project | undefined {
  return projectId ? root.projects.find((p) => p.id === projectId) : root.projects[0]
}

export type SearchKind = 'module' | 'feature' | 'swimnode'

export interface SearchHit {
  projectId: string
  kind: SearchKind
  id: string
  label: string
  snippet: string
}

export interface SearchItem {
  kind: SearchKind
  id: string
  label: string
  /** Concatenated searchable blob (name + description + constraints …). */
  text: string
}

const joinText = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ')

/**
 * The single source of truth for what is searchable in a board. Used by both
 * the in-memory searchBoard (client/tests) and the Postgres search projection
 * (server/infra/repositories.searchRows), so the two never drift apart.
 */
export function searchableItems(data: WorkspaceData): SearchItem[] {
  const items: SearchItem[] = []
  for (const m of data.modules) items.push({ kind: 'module', id: m.id, label: m.name, text: joinText(m.name, m.backbone.name, m.backbone.sub) })
  for (const f of data.features)
    items.push({ kind: 'feature', id: f.id, label: f.name, text: joinText(f.name, f.desc, ...(f.constraints ?? []), ...(f.validations ?? [])) })
  for (const n of data.swimNodes) items.push({ kind: 'swimnode', id: n.id, label: n.label, text: joinText(n.label, n.desc, n.owner, ...(n.constraints ?? [])) })
  return items
}

export function searchBoard(root: Root, query: string, projectId?: string): SearchHit[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const projects = projectId ? root.projects.filter((p) => p.id === projectId) : root.projects
  const hits: SearchHit[] = []
  for (const p of projects)
    for (const it of searchableItems(p.data))
      if (it.text.toLowerCase().includes(q)) hits.push({ projectId: p.id, kind: it.kind, id: it.id, label: it.label, snippet: it.text })
  return hits
}
