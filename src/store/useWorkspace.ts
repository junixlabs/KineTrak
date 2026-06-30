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
  User,
  ViewId,
  WorkspaceData,
} from './types'
import { cloneData, sampleTemplate, blankTemplate } from './seed'
import { makeId, nextNodeCode } from './ids'
import { applyCommand, type Command, type Root } from '@/shared/board'

const PERSIST_VERSION = 2
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

// Sync seam — Phase 3 (client sync layer) installs a real pusher; no-op in local mode.
let pushCommand: (cmd: Command) => void = () => {}
export function setCommandPusher(fn: (cmd: Command) => void) {
  pushCommand = fn
}

export type SyncStatus = 'local' | 'connecting' | 'live'

interface WorkspaceState {
  orgs: Org[]
  projects: Project[]
  activeProjectId: string | null

  // UI
  screen: 'home' | 'workspace' | 'connect'
  present: boolean
  activeView: ViewId
  activeSnapshotId: string | null
  selected: Selection | null
  hoveredId: string | null
  roleFilter: Role | null
  alertsOpen: boolean
  snapMenuOpen: boolean
  syncStatus: SyncStatus

  // Auth (server mode)
  currentUser: User | null
  /** A KineTrak server is reachable — accounts are required to use it. */
  serverPresent: boolean
  /** Initial auth check (GET /me) has completed. */
  authChecked: boolean
  /** Anonymous read-only viewer opened via a public share link. */
  shareMode: boolean

  // Derived
  activeProject: () => Project | undefined
  currentData: () => WorkspaceData
  isReadOnly: () => boolean

  // Navigation
  goHome: () => void
  goConnect: () => void
  openProject: (id: string) => void
  setPresent: (v: boolean) => void
  setView: (v: ViewId) => void
  select: (sel: Selection | null) => void
  clearSelection: () => void
  setHovered: (id: string | null) => void
  setRoleFilter: (role: Role | null) => void
  toggleAlerts: (open?: boolean) => void
  toggleSnapMenu: (open?: boolean) => void

  // Snapshots
  setSnapshot: (id: string | null) => void
  createSnapshot: (name: string) => void
  deleteSnapshot: (id: string) => void

  // Sync (used by the client sync layer)
  setSyncStatus: (s: SyncStatus) => void
  applyServerRoot: (root: Root) => void
  applyServerProject: (project: Project) => void

  // Auth (used by the auth layer)
  setCurrentUser: (user: User | null) => void
  setServerPresent: (v: boolean) => void
  setAuthChecked: (v: boolean) => void
  resetForLogout: () => void
  setShareMode: (v: boolean) => void

  // Org / project
  createOrg: (name: string) => string
  renameOrg: (id: string, name: string) => void
  deleteOrg: (id: string) => void
  createProject: (orgId: string, name: string, template: ProjectTemplate) => string
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void
  switchProject: (id: string) => void
  importProjectData: (json: string) => string | null
  resetAll: () => void

  // Entity CRUD
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

  // Convenience wrappers
  setFeatureStatus: (id: string, status: FeatureStatus) => void
  setSwimStatus: (id: string, status: NodeStatus) => void
  moveFeatureToRelease: (id: string, releaseId: string) => void
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => {
      /** Apply a command locally (optimistic) and push it to the server when synced. */
      const dispatch = (cmd: Command) => {
        set((s) => applyCommand({ orgs: s.orgs, projects: s.projects }, cmd))
        pushCommand(cmd)
      }
      const editable = () => !get().isReadOnly() && !!get().activeProjectId
      const pid = () => get().activeProjectId as string
      const clearSelIf = (id: string) => {
        const sel = get().selected
        if (sel && sel.id === id) set({ selected: null })
      }
      const editView = (): ViewId => (get().activeView === 'story' ? 'story' : 'mindmap')

      return {
        ...makeDefaultRoot(),
        screen: 'home',
        present: false,
        activeView: 'swimlane',
        activeSnapshotId: null,
        selected: null,
        hoveredId: null,
        roleFilter: null,
        alertsOpen: false,
        snapMenuOpen: false,
        syncStatus: 'local',
        currentUser: null,
        serverPresent: false,
        authChecked: false,
        shareMode: false,

        activeProject: () => get().projects.find((p) => p.id === get().activeProjectId),
        currentData: () => {
          const p = get().activeProject()
          if (!p) return EMPTY_DATA
          const sid = get().activeSnapshotId
          if (sid) return p.snapshots.find((s) => s.id === sid)?.data ?? p.data
          return p.data
        },
        isReadOnly: () => get().activeSnapshotId !== null || get().shareMode,

        goHome: () => set({ screen: 'home', present: false, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
        goConnect: () => set({ screen: 'connect', present: false, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
        openProject: (id) => set({ screen: 'workspace', activeProjectId: id, activeSnapshotId: null, selected: null, hoveredId: null }),
        setPresent: (v) => set({ present: v, alertsOpen: false, snapMenuOpen: false, selected: null }),
        setView: (v) => set({ activeView: v, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
        select: (sel) => set({ selected: sel }),
        clearSelection: () => set({ selected: null }),
        setHovered: (id) => set({ hoveredId: id }),
        setRoleFilter: (role) => set({ roleFilter: role }),
        toggleAlerts: (open) => set((s) => ({ alertsOpen: open ?? !s.alertsOpen, snapMenuOpen: false })),
        toggleSnapMenu: (open) => set((s) => ({ snapMenuOpen: open ?? !s.snapMenuOpen, alertsOpen: false })),

        setSyncStatus: (s) => set({ syncStatus: s }),
        setCurrentUser: (user) => set({ currentUser: user }),
        setServerPresent: (v) => set({ serverPresent: v }),
        setAuthChecked: (v) => set({ authChecked: v }),
        setShareMode: (v) => set({ shareMode: v }),
        resetForLogout: () =>
          set({ currentUser: null, orgs: [], projects: [], activeProjectId: null, screen: 'home', present: false, activeSnapshotId: null, selected: null, hoveredId: null }),
        applyServerRoot: (root) =>
          set((s) => {
            const activeProjectId = root.projects.some((p) => p.id === s.activeProjectId)
              ? s.activeProjectId
              : root.projects[0]?.id ?? null
            return { orgs: root.orgs, projects: root.projects, activeProjectId }
          }),

        // Merge a single project pushed by the server (per-project live delta).
        applyServerProject: (project) =>
          set((s) => ({
            projects: s.projects.some((p) => p.id === project.id)
              ? s.projects.map((p) => (p.id === project.id ? project : p))
              : [...s.projects, project],
          })),

        // ── Org / project ──────────────────────────────────────────────────
        createOrg: (name) => {
          const id = makeId('org')
          dispatch({ type: 'createOrg', id, name })
          return id
        },
        renameOrg: (id, name) => dispatch({ type: 'renameOrg', id, name }),
        deleteOrg: (id) => {
          dispatch({ type: 'deleteOrg', id })
          const left = get().projects
          if (!left.some((p) => p.id === get().activeProjectId))
            set({ activeProjectId: left[0]?.id ?? null, activeSnapshotId: null, selected: null })
        },
        createProject: (orgId, name, template) => {
          const id = makeId('p')
          dispatch({ type: 'createProject', id, orgId, name, template, createdAt: nowISO() })
          set({ activeProjectId: id, screen: 'workspace', activeSnapshotId: null, selected: null, hoveredId: null, snapMenuOpen: false })
          return id
        },
        renameProject: (id, name) => dispatch({ type: 'renameProject', id, name }),
        deleteProject: (id) => {
          const wasActive = get().activeProjectId === id
          dispatch({ type: 'deleteProject', id })
          if (wasActive) {
            const left = get().projects
            set({ activeProjectId: left[0]?.id ?? null, activeSnapshotId: null, selected: null, hoveredId: null })
          }
        },
        switchProject: (id) => set({ activeProjectId: id, activeSnapshotId: null, selected: null, hoveredId: null, snapMenuOpen: false }),
        importProjectData: (json) => {
          try {
            const parsed = JSON.parse(json)
            const data = (parsed?.data ?? parsed) as WorkspaceData
            if (!data || !Array.isArray(data.modules) || !Array.isArray(data.lanes)) return null
            const orgId = get().orgs[0]?.id ?? get().createOrg('My workspace')
            const id = makeId('p')
            dispatch({
              type: 'importProject',
              id,
              orgId,
              name: (typeof parsed?.name === 'string' && parsed.name) || 'Imported project',
              createdAt: nowISO(),
              data,
              snapshots: Array.isArray(parsed?.snapshots) ? parsed.snapshots : [],
            })
            set({ activeProjectId: id, screen: 'workspace', activeSnapshotId: null, selected: null })
            return id
          } catch {
            return null
          }
        },
        resetAll: () =>
          set({ ...makeDefaultRoot(), screen: 'home', present: false, activeSnapshotId: null, selected: null, hoveredId: null, roleFilter: null }),

        // ── Entity CRUD ────────────────────────────────────────────────────
        addModule: () => {
          if (!editable()) return
          const id = makeId('m')
          dispatch({ type: 'addModule', projectId: pid(), id })
          set({ selected: { type: 'module', id, view: 'mindmap' } })
        },
        updateModule: (id, patch) => {
          if (!editable()) return
          dispatch({ type: 'updateModule', projectId: pid(), id, patch })
        },
        deleteModule: (id) => {
          if (!editable()) return
          dispatch({ type: 'deleteModule', projectId: pid(), id })
          clearSelIf(id)
        },
        addFeature: (moduleId, releaseId) => {
          if (!editable()) return
          const id = makeId('f')
          dispatch({ type: 'addFeature', projectId: pid(), id, moduleId, releaseId })
          set({ selected: { type: 'feature', id, view: editView() } })
        },
        updateFeature: (id, patch) => {
          if (!editable()) return
          dispatch({ type: 'updateFeature', projectId: pid(), id, patch })
        },
        deleteFeature: (id) => {
          if (!editable()) return
          dispatch({ type: 'deleteFeature', projectId: pid(), id })
          clearSelIf(id)
        },
        addSwimNode: (lane) => {
          if (!editable()) return
          const d = get().currentData()
          const code = nextNodeCode(d.swimNodes.map((n) => n.code))
          const laneObj = d.lanes.find((l) => l.id === lane)
          const count = d.swimNodes.filter((n) => n.lane === lane).length
          const x = 220 + count * 210
          const y = laneObj ? laneObj.y + (laneObj.h - 58) / 2 : 80
          const id = makeId('n')
          dispatch({ type: 'addSwimNode', projectId: pid(), id, code, lane, x, y })
          set({ selected: { type: 'swimnode', id, view: 'swimlane' } })
        },
        updateSwimNode: (id, patch) => {
          if (!editable()) return
          dispatch({ type: 'updateSwimNode', projectId: pid(), id, patch })
        },
        updateSwimNodePos: (id, x, y) => {
          if (!editable()) return
          dispatch({ type: 'updateSwimNodePos', projectId: pid(), id, x, y })
        },
        deleteSwimNode: (id) => {
          if (!editable()) return
          dispatch({ type: 'deleteSwimNode', projectId: pid(), id })
          clearSelIf(id)
        },
        addSwimEdge: (from, to) => {
          if (!editable()) return
          dispatch({ type: 'addSwimEdge', projectId: pid(), from, to })
        },
        deleteSwimEdge: (from, to) => {
          if (!editable()) return
          dispatch({ type: 'deleteSwimEdge', projectId: pid(), from, to })
        },

        // ── Snapshots ──────────────────────────────────────────────────────
        setSnapshot: (id) => set({ activeSnapshotId: id, snapMenuOpen: false, selected: null, hoveredId: null }),
        createSnapshot: (name) => {
          const p = get().activeProjectId
          if (!p) return
          dispatch({ type: 'createSnapshot', projectId: p, id: makeId('snap'), name, date: dateLabel() })
          set({ snapMenuOpen: false })
        },
        deleteSnapshot: (id) => {
          const p = get().activeProjectId
          if (!p) return
          dispatch({ type: 'deleteSnapshot', projectId: p, id })
          if (get().activeSnapshotId === id) set({ activeSnapshotId: null })
        },

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
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        const root = makeDefaultRoot()
        const ov = p.overrides as
          | { featureStatus?: Record<string, FeatureStatus>; featureRelease?: Record<string, string>; swimStatus?: Record<string, NodeStatus> }
          | undefined
        if (ov) {
          const proj = root.projects[0]
          proj.data.features = proj.data.features.map((f) => ({
            ...f,
            ...(ov.featureStatus?.[f.id] ? { status: ov.featureStatus[f.id] } : {}),
            ...(ov.featureRelease?.[f.id] ? { releaseId: ov.featureRelease[f.id] } : {}),
          }))
          proj.data.swimNodes = proj.data.swimNodes.map((n) => (ov.swimStatus?.[n.id] ? { ...n, status: ov.swimStatus[n.id] } : n))
        }
        return { ...root, screen: 'home' as const, activeView: (p.activeView as ViewId) ?? 'swimlane', roleFilter: (p.roleFilter as Role) ?? null }
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WorkspaceState>
        if (!Array.isArray(p.projects) || p.projects.length === 0) {
          return { ...current, ...makeDefaultRoot(), activeView: p.activeView ?? current.activeView, roleFilter: p.roleFilter ?? null }
        }
        return { ...current, ...p, screen: p.screen ?? 'home', present: false, syncStatus: 'local', activeSnapshotId: null, selected: null, hoveredId: null }
      },
    },
  ),
)
