import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  FeatureStatus,
  NodeStatus,
  Org,
  Project,
  ProjectTemplate,
  Role,
  Selection,
  Feature,
  Module,
  SwimNode,
  ViewId,
  WorkspaceData,
} from './types'
import { cloneData, sampleTemplate, blankTemplate, templateData } from './seed'
import { makeId, nextNodeCode } from './ids'

const PERSIST_VERSION = 2

const MODULE_PALETTE = ['#2f6fed', '#0d9488', '#7c5cff', '#f59e0b', '#16a34a', '#e5484d', '#6e8bff']

const EMPTY_DATA: WorkspaceData = blankTemplate()

const nowISO = () => new Date().toISOString()
const dateLabel = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()} · ${p(d.getMonth() + 1)} · ${p(d.getDate())}`
}

function makeDefaultRoot() {
  const org: Org = { id: makeId('org'), name: 'KineTrak' }
  const proj: Project = {
    id: makeId('p'),
    orgId: org.id,
    name: 'KineTrak Platform',
    createdAt: nowISO(),
    data: cloneData(sampleTemplate),
    snapshots: [],
  }
  return { orgs: [org], projects: [proj], activeProjectId: proj.id as string | null }
}

interface WorkspaceState {
  orgs: Org[]
  projects: Project[]
  activeProjectId: string | null

  // UI
  screen: 'home' | 'workspace'
  activeView: ViewId
  activeSnapshotId: string | null
  selected: Selection | null
  hoveredId: string | null
  roleFilter: Role | null
  alertsOpen: boolean
  snapMenuOpen: boolean

  // Derived
  activeProject: () => Project | undefined
  currentData: () => WorkspaceData
  isReadOnly: () => boolean

  // Navigation
  goHome: () => void
  openProject: (id: string) => void
  setView: (v: ViewId) => void
  select: (sel: Selection | null) => void
  clearSelection: () => void
  setHovered: (id: string | null) => void
  setRoleFilter: (role: Role | null) => void
  toggleAlerts: (open?: boolean) => void
  toggleSnapMenu: (open?: boolean) => void

  // Org / project
  createOrg: (name: string) => string
  renameOrg: (id: string, name: string) => void
  deleteOrg: (id: string) => void
  createProject: (orgId: string, name: string, template: ProjectTemplate) => string
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void
  switchProject: (id: string) => void

  // Snapshots (active project)
  createSnapshot: (name: string) => void
  deleteSnapshot: (id: string) => void
  setSnapshot: (id: string | null) => void

  // Entity CRUD (active project live data; no-op while read-only)
  addModule: () => void
  updateModule: (id: string, patch: Partial<Module>) => void
  deleteModule: (id: string) => void
  addFeature: (moduleId: string, releaseId: string) => void
  updateFeature: (id: string, patch: Partial<Feature>) => void
  deleteFeature: (id: string) => void
  addSwimNode: (lane: number) => void
  updateSwimNode: (id: string, patch: Partial<SwimNode>) => void
  updateSwimNodePos: (id: string, x: number, y: number) => void
  deleteSwimNode: (id: string) => void
  addSwimEdge: (from: string, to: string) => void
  deleteSwimEdge: (from: string, to: string) => void

  // Convenience wrappers (status editors)
  setFeatureStatus: (id: string, status: FeatureStatus) => void
  setSwimStatus: (id: string, status: NodeStatus) => void
  moveFeatureToRelease: (id: string, releaseId: string) => void
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => {
      /** Apply an immutable transform to the active project's live data (no-op if read-only). */
      const patchData = (fn: (d: WorkspaceData) => WorkspaceData) => {
        if (get().isReadOnly()) return
        const pid = get().activeProjectId
        if (!pid) return
        set((s) => ({ projects: s.projects.map((p) => (p.id === pid ? { ...p, data: fn(p.data) } : p)) }))
      }
      const clearSelIf = (id: string) => {
        const sel = get().selected
        if (sel && sel.id === id) set({ selected: null })
      }
      const editView = (): ViewId => {
        const v = get().activeView
        return v === 'story' ? 'story' : 'mindmap'
      }

      return {
        ...makeDefaultRoot(),
        screen: 'home',
        activeView: 'swimlane',
        activeSnapshotId: null,
        selected: null,
        hoveredId: null,
        roleFilter: null,
        alertsOpen: false,
        snapMenuOpen: false,

        activeProject: () => get().projects.find((p) => p.id === get().activeProjectId),
        currentData: () => {
          const p = get().activeProject()
          if (!p) return EMPTY_DATA
          const sid = get().activeSnapshotId
          if (sid) return p.snapshots.find((s) => s.id === sid)?.data ?? p.data
          return p.data
        },
        isReadOnly: () => get().activeSnapshotId !== null,

        goHome: () => set({ screen: 'home', selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
        openProject: (id) =>
          set({ screen: 'workspace', activeProjectId: id, activeSnapshotId: null, selected: null, hoveredId: null }),
        setView: (v) => set({ activeView: v, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
        select: (sel) => set({ selected: sel }),
        clearSelection: () => set({ selected: null }),
        setHovered: (id) => set({ hoveredId: id }),
        setRoleFilter: (role) => set({ roleFilter: role }),
        toggleAlerts: (open) => set((s) => ({ alertsOpen: open ?? !s.alertsOpen, snapMenuOpen: false })),
        toggleSnapMenu: (open) => set((s) => ({ snapMenuOpen: open ?? !s.snapMenuOpen, alertsOpen: false })),

        // ── Org / project ──────────────────────────────────────────────────
        createOrg: (name) => {
          const id = makeId('org')
          set((s) => ({ orgs: [...s.orgs, { id, name: name.trim() || 'New org' }] }))
          return id
        },
        renameOrg: (id, name) => set((s) => ({ orgs: s.orgs.map((o) => (o.id === id ? { ...o, name } : o)) })),
        deleteOrg: (id) =>
          set((s) => {
            const projects = s.projects.filter((p) => p.orgId !== id)
            const orgs = s.orgs.filter((o) => o.id !== id)
            const stillActive = projects.some((p) => p.id === s.activeProjectId)
            return {
              orgs,
              projects,
              activeProjectId: stillActive ? s.activeProjectId : projects[0]?.id ?? null,
              activeSnapshotId: null,
              selected: null,
            }
          }),
        createProject: (orgId, name, template) => {
          const id = makeId('p')
          const proj: Project = {
            id,
            orgId,
            name: name.trim() || 'New project',
            createdAt: nowISO(),
            data: templateData(template),
            snapshots: [],
          }
          set((s) => ({
            projects: [...s.projects, proj],
            activeProjectId: id,
            screen: 'workspace',
            activeSnapshotId: null,
            selected: null,
            hoveredId: null,
            snapMenuOpen: false,
          }))
          return id
        },
        renameProject: (id, name) =>
          set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) })),
        deleteProject: (id) =>
          set((s) => {
            const projects = s.projects.filter((p) => p.id !== id)
            const active = s.activeProjectId === id ? projects[0]?.id ?? null : s.activeProjectId
            return { projects, activeProjectId: active, activeSnapshotId: null, selected: null, hoveredId: null }
          }),
        switchProject: (id) =>
          set({ activeProjectId: id, activeSnapshotId: null, selected: null, hoveredId: null, snapMenuOpen: false }),

        // ── Snapshots ──────────────────────────────────────────────────────
        createSnapshot: (name) => {
          const p = get().activeProject()
          if (!p) return
          const snap = {
            id: makeId('snap'),
            name: name.trim() || 'Snapshot',
            date: dateLabel(),
            tag: 'SNAP',
            tagColor: '#2f6fed',
            tagBg: '#e9f1ff',
            dot: '#2f6fed',
            data: cloneData(p.data),
          }
          set((s) => ({
            projects: s.projects.map((x) => (x.id === p.id ? { ...x, snapshots: [snap, ...x.snapshots] } : x)),
            snapMenuOpen: false,
          }))
        },
        deleteSnapshot: (id) => {
          const pid = get().activeProjectId
          set((s) => ({
            projects: s.projects.map((x) => (x.id === pid ? { ...x, snapshots: x.snapshots.filter((sn) => sn.id !== id) } : x)),
            activeSnapshotId: s.activeSnapshotId === id ? null : s.activeSnapshotId,
          }))
        },
        setSnapshot: (id) => set({ activeSnapshotId: id, snapMenuOpen: false, selected: null, hoveredId: null }),

        // ── Entity CRUD ────────────────────────────────────────────────────
        addModule: () => {
          if (get().isReadOnly() || !get().activeProjectId) return
          const id = makeId('m')
          const color = MODULE_PALETTE[get().currentData().modules.length % MODULE_PALETTE.length]
          patchData((d) => ({
            ...d,
            modules: [...d.modules, { id, name: 'New module', color, backbone: { name: 'New step', sub: '' }, owners: [] }],
          }))
          set({ selected: { type: 'module', id, view: 'mindmap' } })
        },
        updateModule: (id, patch) =>
          patchData((d) => ({ ...d, modules: d.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
        deleteModule: (id) => {
          patchData((d) => ({
            ...d,
            modules: d.modules.filter((m) => m.id !== id),
            features: d.features.filter((f) => f.moduleId !== id),
          }))
          clearSelIf(id)
        },
        addFeature: (moduleId, releaseId) => {
          if (get().isReadOnly() || !get().activeProjectId) return
          const id = makeId('f')
          patchData((d) => ({
            ...d,
            features: [...d.features, { id, moduleId, releaseId, name: 'New feature', status: 'progress' }],
          }))
          set({ selected: { type: 'feature', id, view: editView() } })
        },
        updateFeature: (id, patch) =>
          patchData((d) => ({ ...d, features: d.features.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
        deleteFeature: (id) => {
          patchData((d) => ({ ...d, features: d.features.filter((f) => f.id !== id) }))
          clearSelIf(id)
        },
        addSwimNode: (lane) => {
          if (get().isReadOnly() || !get().activeProjectId) return
          const id = makeId('n')
          const d0 = get().currentData()
          const code = nextNodeCode(d0.swimNodes.map((n) => n.code))
          const laneObj = d0.lanes.find((l) => l.id === lane)
          const countInLane = d0.swimNodes.filter((n) => n.lane === lane).length
          const x = 220 + countInLane * 210
          const y = (laneObj ? laneObj.y + (laneObj.h - 58) / 2 : 80)
          patchData((d) => ({
            ...d,
            swimNodes: [...d.swimNodes, { id, code, label: 'New step', lane, kind: 'process', status: 'todo', x, y }],
          }))
          set({ selected: { type: 'swimnode', id, view: 'swimlane' } })
        },
        updateSwimNode: (id, patch) =>
          patchData((d) => ({ ...d, swimNodes: d.swimNodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
        updateSwimNodePos: (id, x, y) =>
          patchData((d) => ({ ...d, swimNodes: d.swimNodes.map((n) => (n.id === id ? { ...n, x, y } : n)) })),
        deleteSwimNode: (id) => {
          patchData((d) => ({
            ...d,
            swimNodes: d.swimNodes.filter((n) => n.id !== id),
            swimEdges: d.swimEdges.filter((e) => e.from !== id && e.to !== id),
          }))
          clearSelIf(id)
        },
        addSwimEdge: (from, to) => {
          if (from === to) return
          patchData((d) =>
            d.swimEdges.some((e) => e.from === from && e.to === to)
              ? d
              : { ...d, swimEdges: [...d.swimEdges, { from, to }] },
          )
        },
        deleteSwimEdge: (from, to) =>
          patchData((d) => ({ ...d, swimEdges: d.swimEdges.filter((e) => !(e.from === from && e.to === to)) })),

        // ── Convenience wrappers ───────────────────────────────────────────
        setFeatureStatus: (id, status) => get().updateFeature(id, { status }),
        setSwimStatus: (id, status) => get().updateSwimNode(id, { status }),
        moveFeatureToRelease: (id, releaseId) => {
          if (get().currentData().releases.some((r) => r.id === releaseId)) get().updateFeature(id, { releaseId })
        },
      }
    },
    {
      name: 'kinetrak-workspace',
      version: PERSIST_VERSION,
      partialize: (s) => ({
        orgs: s.orgs,
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        screen: s.screen,
        activeView: s.activeView,
        roleFilter: s.roleFilter,
      }),
      // v0/v1 stored a single seed + id-keyed overrides. Convert to one org + one project,
      // applying old status/release edits best-effort so nothing visible is lost.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        const root = makeDefaultRoot()
        const ov = p.overrides as { featureStatus?: Record<string, FeatureStatus>; featureRelease?: Record<string, string>; swimStatus?: Record<string, NodeStatus> } | undefined
        if (ov) {
          const proj = root.projects[0]
          proj.data.features = proj.data.features.map((f) => ({
            ...f,
            ...(ov.featureStatus?.[f.id] ? { status: ov.featureStatus[f.id] } : {}),
            ...(ov.featureRelease?.[f.id] ? { releaseId: ov.featureRelease[f.id] } : {}),
          }))
          proj.data.swimNodes = proj.data.swimNodes.map((n) => (ov.swimStatus?.[n.id] ? { ...n, status: ov.swimStatus[n.id] } : n))
        }
        return {
          ...root,
          screen: 'home' as const,
          activeView: (p.activeView as ViewId) ?? 'swimlane',
          roleFilter: (p.roleFilter as Role) ?? null,
        }
      },
      // Guard against empty / corrupt persisted state.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WorkspaceState>
        if (!Array.isArray(p.projects) || p.projects.length === 0) {
          return { ...current, ...makeDefaultRoot(), activeView: p.activeView ?? current.activeView, roleFilter: p.roleFilter ?? null }
        }
        return { ...current, ...p, screen: p.screen ?? 'home', activeSnapshotId: null, selected: null, hoveredId: null }
      },
    },
  ),
)

