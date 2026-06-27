import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  FeatureStatus,
  NodeStatus,
  Role,
  Selection,
  ViewId,
  WorkspaceData,
} from './types'
import { seedData, snapshotData } from './seed'

// Cache derived historical snapshots so currentData() is cheap on every render.
const snapshotCache = new Map<string, WorkspaceData>()
function getSnapshot(id: string): WorkspaceData {
  if (!snapshotCache.has(id)) snapshotCache.set(id, snapshotData(id))
  return snapshotCache.get(id)!
}

interface WorkspaceState {
  /** Live, editable, persisted workspace data. */
  data: WorkspaceData

  // UI state
  activeView: ViewId
  activeSnapshot: string
  selected: Selection | null
  hoveredId: string | null
  roleFilter: Role | null
  alertsOpen: boolean
  snapMenuOpen: boolean

  // Derived
  currentData: () => WorkspaceData
  isReadOnly: () => boolean

  // Navigation
  setView: (v: ViewId) => void
  select: (sel: Selection | null) => void
  clearSelection: () => void
  setHovered: (id: string | null) => void

  // Editing (SSOT) — no-ops while viewing a historical snapshot
  setFeatureStatus: (id: string, status: FeatureStatus) => void
  setSwimStatus: (id: string, status: NodeStatus) => void
  moveFeatureToRelease: (id: string, releaseId: string) => void

  // Shell controls
  setSnapshot: (id: string) => void
  setRoleFilter: (role: Role | null) => void
  toggleAlerts: (open?: boolean) => void
  toggleSnapMenu: (open?: boolean) => void
  resetData: () => void
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      data: seedData,
      activeView: 'swimlane',
      activeSnapshot: 'current',
      selected: null,
      hoveredId: null,
      roleFilter: null,
      alertsOpen: false,
      snapMenuOpen: false,

      currentData: () => {
        const { activeSnapshot, data } = get()
        return activeSnapshot === 'current' ? data : getSnapshot(activeSnapshot)
      },
      isReadOnly: () => get().activeSnapshot !== 'current',

      setView: (v) => set({ activeView: v, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
      select: (sel) => set({ selected: sel }),
      clearSelection: () => set({ selected: null }),
      setHovered: (id) => set({ hoveredId: id }),

      setFeatureStatus: (id, status) => {
        if (get().isReadOnly()) return
        set((s) => ({
          data: { ...s.data, features: s.data.features.map((f) => (f.id === id ? { ...f, status } : f)) },
        }))
      },
      setSwimStatus: (id, status) => {
        if (get().isReadOnly()) return
        set((s) => ({
          data: { ...s.data, swimNodes: s.data.swimNodes.map((n) => (n.id === id ? { ...n, status } : n)) },
        }))
      },
      moveFeatureToRelease: (id, releaseId) => {
        if (get().isReadOnly()) return
        set((s) => ({
          data: { ...s.data, features: s.data.features.map((f) => (f.id === id ? { ...f, releaseId } : f)) },
        }))
      },

      setSnapshot: (id) => set({ activeSnapshot: id, snapMenuOpen: false, selected: null, hoveredId: null }),
      setRoleFilter: (role) => set({ roleFilter: role }),
      toggleAlerts: (open) => set((s) => ({ alertsOpen: open ?? !s.alertsOpen, snapMenuOpen: false })),
      toggleSnapMenu: (open) => set((s) => ({ snapMenuOpen: open ?? !s.snapMenuOpen, alertsOpen: false })),
      resetData: () => set({ data: seedData, activeSnapshot: 'current', selected: null, hoveredId: null }),
    }),
    {
      name: 'kinetrak-workspace',
      partialize: (s) => ({
        data: s.data,
        activeView: s.activeView,
        activeSnapshot: s.activeSnapshot,
        roleFilter: s.roleFilter,
      }),
    },
  ),
)
