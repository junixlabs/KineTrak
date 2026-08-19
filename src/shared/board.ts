// Pure board command reducer shared by the client store, the server, and MCP tools.
// Applying the same Command on any of them yields identical state, because the
// originator mints all ids/timestamps and passes them inside the command.
//
// Uses only relative imports + Node-safe helpers (crypto.randomUUID / structuredClone)
// so it runs unchanged under both Vite and tsx.
import type {
  Alert,
  CodeRef,
  Feature,
  Module,
  NodeKind,
  Org,
  OrgBoard,
  OrgBoardEdge,
  OrgBoardEdgeKind,
  OrgBoardNode,
  Project,
  ProjectTemplate,
  Release,
  Snapshot,
  SwimLane,
  SwimNode,
  WorkspaceData,
  WorkspaceSettings,
} from './types'
import { templateData, cloneData } from './seed'

export interface Root {
  orgs: Org[]
  projects: Project[]
  /** Org-level system maps. Optional so legacy roots/payloads stay valid. */
  orgBoards?: OrgBoard[]
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
  | { type: 'addSwimNode'; projectId: string; id: string; code: string; lane: number; x: number; y: number; label?: string; kind?: NodeKind; flowId?: string }
  | { type: 'updateSwimNode'; projectId: string; id: string; patch: Partial<SwimNode> }
  | { type: 'updateSwimNodePos'; projectId: string; id: string; x: number; y: number }
  | { type: 'arrangeSwimNodes'; projectId: string; positions: { id: string; x: number; y: number }[] }
  | { type: 'deleteSwimNode'; projectId: string; id: string }
  | { type: 'addSwimEdge'; projectId: string; from: string; to: string; branch?: string }
  | { type: 'deleteSwimEdge'; projectId: string; from: string; to: string }
  | { type: 'reorderModules'; projectId: string; orderedIds: string[] }
  | { type: 'reorderFeatures'; projectId: string; orderedIds: string[] }
  | { type: 'createSnapshot'; projectId: string; id: string; name: string; date: string }
  | { type: 'deleteSnapshot'; projectId: string; id: string }
  | { type: 'appendNote'; projectId: string; target: 'feature' | 'swimnode'; id: string; text: string }
  | { type: 'updateSettings'; projectId: string; patch: Partial<WorkspaceSettings> }
  // ── Business-logic SSOT ──────────────────────────────────────────────────
  | { type: 'linkFeatureStep'; projectId: string; featureId: string; nodeId: string; op: 'link' | 'unlink' }
  | { type: 'linkCode'; projectId: string; target: 'feature' | 'swimnode'; id: string; ref: CodeRef; op: 'link' | 'unlink' }
  | { type: 'setDependency'; projectId: string; featureId: string; dependsOnId: string; op: 'add' | 'remove' }
  | { type: 'setAcceptance'; projectId: string; target: 'feature' | 'swimnode'; id: string; items: string[] }
  | { type: 'checkAcceptance'; projectId: string; target: 'feature' | 'swimnode'; id: string; index: number; done: boolean }
  | { type: 'markCodeStale'; projectId: string; targets: { target: 'feature' | 'swimnode'; id: string }[]; stale: boolean }
  | { type: 'addLane'; projectId: string; id: number; name?: string }
  | { type: 'updateLane'; projectId: string; id: number; patch: Partial<SwimLane> }
  | { type: 'deleteLane'; projectId: string; id: number }
  | { type: 'addRelease'; projectId: string; id: string; name?: string }
  | { type: 'updateRelease'; projectId: string; id: string; patch: Partial<Release> }
  | { type: 'deleteRelease'; projectId: string; id: string }
  | { type: 'askHuman'; projectId: string; id: string; question: string; nodeId?: string; view?: 'mindmap' | 'story' | 'swimlane'; options?: string[] }
  | { type: 'answerQuestion'; projectId: string; id: string; answer: string }
  | { type: 'resolveQuestion'; projectId: string; id: string }
  | { type: 'reportFriction'; projectId: string; id: string; tool: string; wanted: string; tried: string; received: string; workaround: string; params?: string[]; nodeId?: string; view?: 'mindmap' | 'story' | 'swimlane' }
  // ── Org boards (system maps) ─────────────────────────────────────────────
  | { type: 'createOrgBoard'; id: string; orgId: string; name: string; createdAt: string; nodes?: OrgBoardNode[] }
  | { type: 'renameOrgBoard'; id: string; name: string }
  | { type: 'deleteOrgBoard'; id: string }
  | { type: 'addOrgBoardNode'; boardId: string; id: string; label?: string; projectId?: string; x: number; y: number }
  | { type: 'updateOrgBoardNode'; boardId: string; id: string; patch: Partial<OrgBoardNode> }
  | { type: 'deleteOrgBoardNode'; boardId: string; id: string }
  | { type: 'addOrgBoardEdge'; boardId: string; from: string; to: string; label?: string; kind?: OrgBoardEdgeKind; desc?: string; fromFeatureId?: string; toFeatureId?: string }
  | { type: 'updateOrgBoardEdge'; boardId: string; from: string; to: string; patch: Partial<OrgBoardEdge> }
  | { type: 'deleteOrgBoardEdge'; boardId: string; from: string; to: string }
  | { type: 'linkOrgEdgeCode'; boardId: string; from: string; to: string; ref: CodeRef; op: 'link' | 'unlink' }
  | { type: 'markOrgEdgeStale'; boardId: string; edges: { from: string; to: string }[]; stale: boolean }

const mapOrgBoard = (root: Root, boardId: string, fn: (b: OrgBoard) => OrgBoard): Root => ({
  ...root,
  orgBoards: (root.orgBoards ?? []).map((b) => (b.id === boardId ? fn(b) : b)),
})

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
      return {
        orgs: root.orgs.filter((o) => o.id !== cmd.id),
        projects: root.projects.filter((p) => p.orgId !== cmd.id),
        orgBoards: (root.orgBoards ?? []).filter((b) => b.orgId !== cmd.id),
      }

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
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        // Children are promoted, never cascade-deleted.
        features: d.features.filter((f) => f.id !== cmd.id).map((f) => (f.parentId === cmd.id ? { ...f, parentId: undefined } : f)),
      }))

    case 'addSwimNode':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        swimNodes: [...d.swimNodes, { id: cmd.id, code: cmd.code, label: cmd.label ?? 'New step', lane: cmd.lane, kind: cmd.kind ?? 'process', status: 'todo', x: cmd.x, y: cmd.y, ...(cmd.flowId ? { flowId: cmd.flowId } : {}) }],
      }))
    case 'updateSwimNode':
      return mapData(root, cmd.projectId, (d) => ({ ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? { ...n, ...cmd.patch } : n)) }))
    case 'updateSwimNodePos':
      return mapData(root, cmd.projectId, (d) => ({ ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? { ...n, x: cmd.x, y: cmd.y } : n)) }))
    case 'arrangeSwimNodes': {
      const pos = new Map(cmd.positions.map((p) => [p.id, p]))
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        swimNodes: d.swimNodes.map((n) => {
          const p = pos.get(n.id)
          return p ? { ...n, x: p.x, y: p.y } : n
        }),
      }))
    }
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

    // ── Business-logic SSOT ────────────────────────────────────────────────────
    case 'linkFeatureStep':
      return mapData(root, cmd.projectId, (d) => {
        const feat = d.features.find((f) => f.id === cmd.featureId)
        const node = d.swimNodes.find((n) => n.id === cmd.nodeId)
        if (!feat || !node) return d
        const upFeat = (links: import('./types').CrossLink[] = []) =>
          cmd.op === 'unlink'
            ? links.filter((l) => !(l.view === 'swimlane' && l.targetId === cmd.nodeId))
            : links.some((l) => l.view === 'swimlane' && l.targetId === cmd.nodeId)
              ? links
              : [...links, { view: 'swimlane' as const, label: `Swimlane · ${node.code ?? node.label}`, targetId: cmd.nodeId }]
        const upNode = (links: import('./types').CrossLink[] = []) =>
          cmd.op === 'unlink'
            ? links.filter((l) => !(l.view === 'mindmap' && l.targetId === cmd.featureId))
            : links.some((l) => l.view === 'mindmap' && l.targetId === cmd.featureId)
              ? links
              : [...links, { view: 'mindmap' as const, label: `Mindmap · ${feat.name}`, targetId: cmd.featureId }]
        return {
          ...d,
          features: d.features.map((f) => (f.id === cmd.featureId ? { ...f, crossLinks: upFeat(f.crossLinks) } : f)),
          swimNodes: d.swimNodes.map((n) => (n.id === cmd.nodeId ? { ...n, crossLinks: upNode(n.crossLinks) } : n)),
        }
      })

    case 'linkCode':
      return mapData(root, cmd.projectId, (d) => {
        const same = (a: CodeRef, b: CodeRef) => a.path === b.path && (a.symbol ?? '') === (b.symbol ?? '')
        const up = <T extends { codeRefs?: CodeRef[]; codeStale?: boolean }>(x: T): T =>
          cmd.op === 'unlink'
            ? { ...x, codeRefs: (x.codeRefs ?? []).filter((r) => !same(r, cmd.ref)) }
            : // re-linking = reconciling → clear the stale flag
              { ...x, codeStale: false, codeRefs: [...(x.codeRefs ?? []).filter((r) => !same(r, cmd.ref)), cmd.ref] }
        return cmd.target === 'feature'
          ? { ...d, features: d.features.map((f) => (f.id === cmd.id ? up(f) : f)) }
          : { ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? up(n) : n)) }
      })

    case 'setDependency':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        features: d.features.map((f) => {
          if (f.id !== cmd.featureId || cmd.dependsOnId === cmd.featureId) return f
          const cur = f.dependsOn ?? []
          const next = cmd.op === 'remove' ? cur.filter((x) => x !== cmd.dependsOnId) : cur.includes(cmd.dependsOnId) ? cur : [...cur, cmd.dependsOnId]
          return { ...f, dependsOn: next }
        }),
      }))

    case 'setAcceptance':
      return mapData(root, cmd.projectId, (d) => {
        const up = <T extends { validations?: string[]; validationsDone?: string[] }>(x: T): T => ({
          ...x,
          validations: cmd.items,
          validationsDone: (x.validationsDone ?? []).filter((t) => cmd.items.includes(t)),
        })
        return cmd.target === 'feature'
          ? { ...d, features: d.features.map((f) => (f.id === cmd.id ? up(f) : f)) }
          : { ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? up(n) : n)) }
      })

    case 'checkAcceptance':
      return mapData(root, cmd.projectId, (d) => {
        const up = <T extends { validations?: string[]; validationsDone?: string[] }>(x: T): T => {
          const item = (x.validations ?? [])[cmd.index]
          if (item === undefined) return x
          const done = new Set(x.validationsDone ?? [])
          if (cmd.done) done.add(item)
          else done.delete(item)
          return { ...x, validationsDone: [...done] }
        }
        return cmd.target === 'feature'
          ? { ...d, features: d.features.map((f) => (f.id === cmd.id ? up(f) : f)) }
          : { ...d, swimNodes: d.swimNodes.map((n) => (n.id === cmd.id ? up(n) : n)) }
      })

    case 'markCodeStale':
      return mapData(root, cmd.projectId, (d) => {
        const feats = new Set(cmd.targets.filter((t) => t.target === 'feature').map((t) => t.id))
        const nodes = new Set(cmd.targets.filter((t) => t.target === 'swimnode').map((t) => t.id))
        return {
          ...d,
          features: d.features.map((f) => (feats.has(f.id) ? { ...f, codeStale: cmd.stale } : f)),
          swimNodes: d.swimNodes.map((n) => (nodes.has(n.id) ? { ...n, codeStale: cmd.stale } : n)),
        }
      })

    case 'addLane':
      return mapData(root, cmd.projectId, (d) => {
        const last = d.lanes[d.lanes.length - 1]
        const h = last?.h ?? 96
        const y = last ? last.y + last.h : 0
        return {
          ...d,
          lanes: [...d.lanes, { id: cmd.id, name: cmd.name ?? 'New lane', sub: '', color: MODULE_PALETTE[d.lanes.length % MODULE_PALETTE.length], owners: [], y, h }],
        }
      })
    case 'updateLane':
      return mapData(root, cmd.projectId, (d) => ({ ...d, lanes: d.lanes.map((l) => (l.id === cmd.id ? { ...l, ...cmd.patch } : l)) }))
    case 'deleteLane':
      return mapData(root, cmd.projectId, (d) => {
        const remaining = d.lanes.filter((l) => l.id !== cmd.id)
        const fallback = remaining[0]?.id
        return {
          ...d,
          lanes: remaining,
          // Reassign orphaned steps to the first remaining lane (never leave a bad lane).
          swimNodes: fallback === undefined ? d.swimNodes : d.swimNodes.map((n) => (n.lane === cmd.id ? { ...n, lane: fallback } : n)),
        }
      })

    case 'addRelease':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        releases: [...d.releases, { id: cmd.id, name: cmd.name ?? 'New release', tag: (cmd.name ?? 'REL').slice(0, 4).toUpperCase(), color: '#2f6fed', bg: '#e9f1ff', bdr: '#d3deff' }],
      }))
    case 'updateRelease':
      return mapData(root, cmd.projectId, (d) => ({ ...d, releases: d.releases.map((r) => (r.id === cmd.id ? { ...r, ...cmd.patch } : r)) }))
    case 'deleteRelease':
      return mapData(root, cmd.projectId, (d) => {
        const remaining = d.releases.filter((r) => r.id !== cmd.id)
        const fallback = remaining[0]?.id
        return {
          ...d,
          releases: remaining,
          features: fallback === undefined ? d.features : d.features.map((f) => (f.releaseId === cmd.id ? { ...f, releaseId: fallback } : f)),
        }
      })

    case 'askHuman':
      return mapData(root, cmd.projectId, (d) => {
        const sel = cmd.nodeId ? { type: 'swimnode' as const, id: cmd.nodeId, view: (cmd.view ?? 'swimlane') as import('./types').ViewId } : null
        const alert: Alert = {
          id: cmd.id,
          kind: 'question',
          title: 'Needs a decision',
          detail: cmd.question + (cmd.options?.length ? `  ·  Options: ${cmd.options.join(' / ')}` : ''),
          tags: ['@human'],
          time: 'pending',
          actionLabel: cmd.nodeId ? 'Open step' : 'Review',
          action: { view: cmd.view ?? 'swimlane', selection: sel },
          ...(cmd.options?.length ? { options: cmd.options } : {}),
        }
        return { ...d, alerts: [...d.alerts, alert] }
      })
    case 'answerQuestion':
      return mapData(root, cmd.projectId, (d) => ({
        ...d,
        alerts: d.alerts.map((a) => (a.id === cmd.id && a.kind === 'question' ? { ...a, answer: cmd.answer, time: 'answered' } : a)),
      }))
    case 'resolveQuestion':
      return mapData(root, cmd.projectId, (d) => ({ ...d, alerts: d.alerts.filter((a) => a.id !== cmd.id) }))
    case 'reportFriction':
      // cm:guard never set time:'pending' or options/answer here — 'friction' is a report about
      // KineTrak's own tooling, and those fields are what put an alert in the human-DECISION queue.
      return mapData(root, cmd.projectId, (d) => {
        const sel = cmd.nodeId ? { type: 'swimnode' as const, id: cmd.nodeId, view: (cmd.view ?? 'swimlane') as import('./types').ViewId } : null
        const alert: Alert = {
          id: cmd.id,
          kind: 'friction',
          title: `Tooling friction · ${cmd.tool}`,
          // cm:edge contract -> src/components/shell/AlertsPanel.tsx — the four fields are newline-
          // separated and only render as lines because both detail cells set whitespace-pre-line.
          detail: [
            `Wanted: ${cmd.wanted}`,
            `Tried: ${cmd.tool}${cmd.params?.length ? `(${cmd.params.join(', ')})` : ''} — ${cmd.tried}`,
            `Got: ${cmd.received}`,
            `Workaround: ${cmd.workaround}`,
          ].join('\n'),
          tags: ['@tooling'],
          time: 'reported',
          actionLabel: cmd.nodeId ? 'Open step' : '',
          action: { view: cmd.view ?? 'swimlane', selection: sel },
        }
        return { ...d, alerts: [...d.alerts, alert] }
      })

    // ── Org boards (system maps) ───────────────────────────────────────────────
    case 'createOrgBoard':
      return {
        ...root,
        orgBoards: [
          ...(root.orgBoards ?? []),
          { id: cmd.id, orgId: cmd.orgId, name: cmd.name.trim() || 'System map', createdAt: cmd.createdAt, nodes: cmd.nodes ?? [], edges: [] },
        ],
      }
    case 'renameOrgBoard':
      return { ...root, orgBoards: (root.orgBoards ?? []).map((b) => (b.id === cmd.id ? { ...b, name: cmd.name } : b)) }
    case 'deleteOrgBoard':
      return { ...root, orgBoards: (root.orgBoards ?? []).filter((b) => b.id !== cmd.id) }

    case 'addOrgBoardNode':
      return mapOrgBoard(root, cmd.boardId, (b) => ({
        ...b,
        nodes: [...b.nodes, { id: cmd.id, label: cmd.label ?? 'New system', x: cmd.x, y: cmd.y, ...(cmd.projectId ? { projectId: cmd.projectId } : {}) }],
      }))
    case 'updateOrgBoardNode':
      return mapOrgBoard(root, cmd.boardId, (b) => {
        const prev = b.nodes.find((n) => n.id === cmd.id)
        if (!prev) return b
        // "" clears projectId (a plain undefined would be dropped by the JSON
        // command transport, so clients send the empty-string sentinel).
        const patch = { ...cmd.patch }
        if (patch.projectId === '') patch.projectId = undefined
        const nodes = b.nodes.map((n) => (n.id === cmd.id ? { ...n, ...patch } : n))
        // Re-pointing (or detaching) the node's project strands feature anchors
        // from the old project on touching edges — clear them, never dangle silently.
        const projectChanged = 'projectId' in cmd.patch && patch.projectId !== prev.projectId
        const edges = projectChanged
          ? b.edges.map((e) => (e.from === cmd.id ? { ...e, fromFeatureId: undefined } : e.to === cmd.id ? { ...e, toFeatureId: undefined } : e))
          : b.edges
        return { ...b, nodes, edges }
      })
    case 'deleteOrgBoardNode':
      return mapOrgBoard(root, cmd.boardId, (b) => ({
        ...b,
        nodes: b.nodes.filter((n) => n.id !== cmd.id),
        edges: b.edges.filter((e) => e.from !== cmd.id && e.to !== cmd.id),
      }))
    case 'addOrgBoardEdge':
      if (cmd.from === cmd.to) return root
      return mapOrgBoard(root, cmd.boardId, (b) =>
        b.edges.some((e) => e.from === cmd.from && e.to === cmd.to)
          ? b
          : {
              ...b,
              edges: [
                ...b.edges,
                {
                  from: cmd.from,
                  to: cmd.to,
                  ...(cmd.label ? { label: cmd.label } : {}),
                  ...(cmd.kind ? { kind: cmd.kind } : {}),
                  ...(cmd.desc ? { desc: cmd.desc } : {}),
                  ...(cmd.fromFeatureId ? { fromFeatureId: cmd.fromFeatureId } : {}),
                  ...(cmd.toFeatureId ? { toFeatureId: cmd.toFeatureId } : {}),
                },
              ],
            },
      )
    case 'updateOrgBoardEdge':
      return mapOrgBoard(root, cmd.boardId, (b) => ({
        ...b,
        edges: b.edges.map((e) => {
          if (!(e.from === cmd.from && e.to === cmd.to)) return e
          // "" clears an anchor (undefined would be dropped by the JSON transport).
          const patch = { ...cmd.patch }
          if (patch.fromFeatureId === '') patch.fromFeatureId = undefined
          if (patch.toFeatureId === '') patch.toFeatureId = undefined
          // Touching the contract itself (desc/codeRefs) = reconciling → clear the
          // stale flag; a label/kind/anchor tweak is not a reconciliation.
          const reconciles = 'desc' in cmd.patch || 'codeRefs' in cmd.patch
          return { ...e, ...patch, ...(reconciles && !('codeStale' in cmd.patch) ? { codeStale: false } : {}) }
        }),
      }))
    case 'deleteOrgBoardEdge':
      return mapOrgBoard(root, cmd.boardId, (b) => ({ ...b, edges: b.edges.filter((e) => !(e.from === cmd.from && e.to === cmd.to)) }))

    case 'linkOrgEdgeCode':
      return mapOrgBoard(root, cmd.boardId, (b) => {
        const same = (a: CodeRef, x: CodeRef) => a.path === x.path && (a.symbol ?? '') === (x.symbol ?? '')
        return {
          ...b,
          edges: b.edges.map((e) => {
            if (!(e.from === cmd.from && e.to === cmd.to)) return e
            return cmd.op === 'unlink'
              ? { ...e, codeRefs: (e.codeRefs ?? []).filter((r) => !same(r, cmd.ref)) }
              : // re-linking = reconciling → clear the stale flag (mirrors linkCode)
                { ...e, codeStale: false, codeRefs: [...(e.codeRefs ?? []).filter((r) => !same(r, cmd.ref)), cmd.ref] }
          }),
        }
      })
    case 'markOrgEdgeStale': {
      const keys = new Set(cmd.edges.map((e) => `${e.from}→${e.to}`))
      return mapOrgBoard(root, cmd.boardId, (b) => ({
        ...b,
        edges: b.edges.map((e) => (keys.has(`${e.from}→${e.to}`) ? { ...e, codeStale: cmd.stale } : e)),
      }))
    }

    default:
      return root
  }
}

// ── Org-board helpers ─────────────────────────────────────────────────────────

/** Seed a new org board from the org's existing projects: one node per project,
 *  laid out on a grid. Deterministic given the same (ordered) project list; ids
 *  are minted by the caller via `makeNodeId` so the command stays replayable. */
export function seedOrgBoardNodes(projects: { id: string; name: string }[], makeNodeId: () => string): OrgBoardNode[] {
  const PER_ROW = 3
  return projects.map((p, i) => ({
    id: makeNodeId(),
    projectId: p.id,
    label: p.name,
    x: 120 + (i % PER_ROW) * 300,
    y: 100 + Math.floor(i / PER_ROW) * 160,
  }))
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
  const refText = (refs?: import('./types').CodeRef[]) => (refs ?? []).map((r) => joinText(r.path, r.symbol)).join(' ')
  for (const f of data.features)
    items.push({ kind: 'feature', id: f.id, label: f.name, text: joinText(f.name, f.desc, ...(f.constraints ?? []), ...(f.validations ?? []), refText(f.codeRefs)) })
  for (const n of data.swimNodes) items.push({ kind: 'swimnode', id: n.id, label: n.label, text: joinText(n.label, n.desc, n.owner, ...(n.constraints ?? []), refText(n.codeRefs)) })
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
