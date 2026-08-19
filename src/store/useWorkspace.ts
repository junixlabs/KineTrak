import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  FeatureStatus,
  NodeStatus,
  Org,
  OrgBoard,
  OrgBoardEdge,
  OrgBoardNode,
  OrgBoardSel,
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
import { applyCommand, seedOrgBoardNodes, type Command, type Root } from '@/shared/board'
import { autoArrangeSwimlane, arrangeAllFlows } from '@/lib/swimlayout'
import { isDismissibleAlertKind } from '@/lib/impact'

/** UI-only view selector: the three diagram views plus the derived Overview.
 *  Kept separate from the domain `ViewId` (used by crossLinks/selection/alerts). */
export type WorkView = ViewId | 'overview'

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
  return { orgs: [org], projects: [proj], orgBoards: [] as OrgBoard[], activeProjectId: proj.id as string | null, activeOrgBoardId: null as string | null }
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
  orgBoards: OrgBoard[]
  activeProjectId: string | null
  activeOrgBoardId: string | null
  /** One-shot selection consumed by OrgBoardView on mount (alert/panel deep-link). */
  orgBoardInitialSel: OrgBoardSel | null

  // UI
  screen: 'home' | 'workspace' | 'connect' | 'guide' | 'orgboard'
  present: boolean
  activeView: WorkView
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
  activeOrgBoard: () => OrgBoard | undefined
  currentData: () => WorkspaceData
  isReadOnly: () => boolean

  // Navigation
  goHome: () => void
  goConnect: () => void
  goGuide: () => void
  openProject: (id: string) => void
  setPresent: (v: boolean) => void
  setView: (v: WorkView) => void
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
  applyServerOrgBoard: (board: OrgBoard) => void

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

  // Org boards (system maps)
  createOrgBoard: (orgId: string, name: string, seedFromProjects?: boolean) => string
  renameOrgBoard: (id: string, name: string) => void
  deleteOrgBoard: (id: string) => void
  openOrgBoard: (id: string, sel?: OrgBoardSel) => void
  consumeOrgBoardSel: () => OrgBoardSel | null
  addOrgBoardNode: (label: string, projectId?: string) => void
  updateOrgBoardNode: (id: string, patch: Partial<OrgBoardNode>) => void
  deleteOrgBoardNode: (id: string) => void
  addOrgBoardEdge: (from: string, to: string) => void
  updateOrgBoardEdge: (from: string, to: string, patch: Partial<OrgBoardEdge>) => void
  deleteOrgBoardEdge: (from: string, to: string) => void

  // Entity CRUD
  addModule: () => void
  updateModule: (id: string, patch: Partial<Module>) => void
  deleteModule: (id: string) => void
  addFeature: (moduleId: string, releaseId: string) => void
  updateFeature: (id: string, patch: Partial<Feature>) => void
  deleteFeature: (id: string) => void
  addSwimNode: (lane: number, flowId: string) => void
  updateSwimNode: (id: string, patch: Partial<SwimNode>) => void
  updateSwimNodePos: (id: string, x: number, y: number) => void
  arrangeSwimNodes: (flowId?: string) => void
  deleteSwimNode: (id: string) => void
  addSwimEdge: (from: string, to: string) => void
  deleteSwimEdge: (from: string, to: string) => void
  /** Dismiss a stored alert (question / friction). Derived kinds are recomputed, so not dismissible. */
  dismissAlert: (id: string) => void

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
        set((s) => applyCommand({ orgs: s.orgs, projects: s.projects, orgBoards: s.orgBoards }, cmd))
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
        orgBoardInitialSel: null,
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
        activeOrgBoard: () => get().orgBoards.find((b) => b.id === get().activeOrgBoardId),
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
        goGuide: () => set({ screen: 'guide', present: false, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
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
          set({ currentUser: null, orgs: [], projects: [], orgBoards: [], activeProjectId: null, activeOrgBoardId: null, screen: 'home', present: false, activeSnapshotId: null, selected: null, hoveredId: null }),
        applyServerRoot: (root) =>
          set((s) => {
            const activeProjectId = root.projects.some((p) => p.id === s.activeProjectId)
              ? s.activeProjectId
              : root.projects[0]?.id ?? null
            const orgBoards = root.orgBoards ?? []
            const activeOrgBoardId = orgBoards.some((b) => b.id === s.activeOrgBoardId) ? s.activeOrgBoardId : null
            return {
              orgs: root.orgs,
              projects: root.projects,
              orgBoards,
              activeProjectId,
              activeOrgBoardId,
              // The open board was deleted elsewhere — fall back Home instead of a blank canvas.
              ...(s.screen === 'orgboard' && !activeOrgBoardId ? { screen: 'home' as const } : {}),
            }
          }),

        // Merge a single project pushed by the server (per-project live delta).
        applyServerProject: (project) =>
          set((s) => ({
            projects: s.projects.some((p) => p.id === project.id)
              ? s.projects.map((p) => (p.id === project.id ? project : p))
              : [...s.projects, project],
          })),

        // Merge one org board pushed by the server (deletes ride the full resync).
        applyServerOrgBoard: (board) =>
          set((s) => ({
            orgBoards: s.orgBoards.some((b) => b.id === board.id)
              ? s.orgBoards.map((b) => (b.id === board.id ? board : b))
              : [...s.orgBoards, board],
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

        // ── Org boards (system maps) ───────────────────────────────────────
        createOrgBoard: (orgId, name, seedFromProjects = true) => {
          const id = makeId('ob')
          const nodes = seedFromProjects
            ? seedOrgBoardNodes(get().projects.filter((p) => p.orgId === orgId), () => makeId('obn'))
            : []
          dispatch({ type: 'createOrgBoard', id, orgId, name, createdAt: nowISO(), nodes })
          set({ screen: 'orgboard', activeOrgBoardId: id })
          return id
        },
        renameOrgBoard: (id, name) => dispatch({ type: 'renameOrgBoard', id, name }),
        deleteOrgBoard: (id) => {
          const wasActive = get().activeOrgBoardId === id
          dispatch({ type: 'deleteOrgBoard', id })
          if (wasActive) set({ activeOrgBoardId: null, ...(get().screen === 'orgboard' ? { screen: 'home' as const } : {}) })
        },
        openOrgBoard: (id, sel) => set({ screen: 'orgboard', activeOrgBoardId: id, orgBoardInitialSel: sel ?? null, selected: null, hoveredId: null }),
        consumeOrgBoardSel: () => {
          const sel = get().orgBoardInitialSel
          if (sel) set({ orgBoardInitialSel: null })
          return sel
        },
        addOrgBoardNode: (label, projectId) => {
          const b = get().activeOrgBoard()
          if (!b || get().shareMode) return
          const i = b.nodes.length
          dispatch({ type: 'addOrgBoardNode', boardId: b.id, id: makeId('obn'), label, projectId, x: 120 + (i % 3) * 300, y: 100 + Math.floor(i / 3) * 160 })
        },
        updateOrgBoardNode: (id, patch) => {
          const b = get().activeOrgBoard()
          if (!b || get().shareMode) return
          dispatch({ type: 'updateOrgBoardNode', boardId: b.id, id, patch })
        },
        deleteOrgBoardNode: (id) => {
          const b = get().activeOrgBoard()
          if (!b || get().shareMode) return
          dispatch({ type: 'deleteOrgBoardNode', boardId: b.id, id })
        },
        addOrgBoardEdge: (from, to) => {
          const b = get().activeOrgBoard()
          if (!b || get().shareMode) return
          dispatch({ type: 'addOrgBoardEdge', boardId: b.id, from, to })
        },
        updateOrgBoardEdge: (from, to, patch) => {
          const b = get().activeOrgBoard()
          if (!b || get().shareMode) return
          dispatch({ type: 'updateOrgBoardEdge', boardId: b.id, from, to, patch })
        },
        deleteOrgBoardEdge: (from, to) => {
          const b = get().activeOrgBoard()
          if (!b || get().shareMode) return
          dispatch({ type: 'deleteOrgBoardEdge', boardId: b.id, from, to })
        },

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
        addSwimNode: (lane, flowId) => {
          if (!editable() || !flowId) return // every step must belong to a feature flow
          const d = get().currentData()
          const code = nextNodeCode(d.swimNodes.map((n) => n.code))
          const laneObj = d.lanes.find((l) => l.id === lane)
          // Place clear of existing steps in this lane (across all flows); Auto-arrange bands them later.
          const inLane = d.swimNodes.filter((n) => n.lane === lane)
          const x = inLane.length ? Math.max(...inLane.map((n) => n.x)) + 210 : 220
          const y = laneObj ? laneObj.y + (laneObj.h - 58) / 2 : 80
          const id = makeId('n')
          dispatch({ type: 'addSwimNode', projectId: pid(), id, code, lane, x, y, flowId })
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
        arrangeSwimNodes: (flowId) => {
          if (!editable()) return
          const d = get().currentData()
          // Whole board (All flows): band every flow into its own x-range so flows never overlap.
          // Scoped to one flow: arrange its steps (plus any legacy unscoped) clear of the other flows.
          const positions = flowId
            ? autoArrangeSwimlane(
                d.swimNodes.filter((n) => !n.flowId || n.flowId === flowId),
                d.swimEdges,
                d.lanes,
                d.swimNodes.filter((n) => n.flowId && n.flowId !== flowId),
              )
            : arrangeAllFlows(d.swimNodes, d.swimEdges, d.lanes)
          if (positions.length) dispatch({ type: 'arrangeSwimNodes', projectId: pid(), positions })
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
        // cm:edge contract -> src/lib/impact.ts#isDismissibleAlertKind — the kind check lives here so
        // the invariant survives a caller that is not the AlertsPanel render predicate.
        dismissAlert: (id) => {
          if (!editable()) return
          const a = get().currentData().alerts.find((x) => x.id === id)
          if (!a || !isDismissibleAlertKind(a.kind)) return
          dispatch({ type: 'resolveQuestion', projectId: pid(), id })
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
        orgBoards: s.orgBoards,
        activeProjectId: s.activeProjectId,
        activeOrgBoardId: s.activeOrgBoardId,
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
        return { ...root, screen: 'home' as const, activeView: (p.activeView as WorkView) ?? 'swimlane', roleFilter: (p.roleFilter as Role) ?? null }
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
