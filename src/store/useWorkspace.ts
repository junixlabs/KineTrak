import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  FeatureStatus,
  NodeStatus,
  Overrides,
  Role,
  Selection,
  ViewId,
  WorkspaceData,
} from './types'
import { emptyOverrides } from './types'
import { applyOverrides, seedData, snapshotData } from './seed'

/** Bump when the persisted shape (Overrides / persisted ui keys) changes incompatibly. */
const PERSIST_VERSION = 1

// Cache derived historical snapshots so currentData() is cheap on every render.
const snapshotCache = new Map<string, WorkspaceData>()
function getSnapshot(id: string): WorkspaceData {
  if (!snapshotCache.has(id)) snapshotCache.set(id, snapshotData(id))
  return snapshotCache.get(id)!
}

const hasFeature = (id: string) => seedData.features.some((f) => f.id === id)
const hasSwimNode = (id: string) => seedData.swimNodes.some((n) => n.id === id)
const hasRelease = (id: string) => seedData.releases.some((r) => r.id === id)

interface WorkspaceState {
  /** User edits as id-keyed deltas — the ONLY thing persisted from the data graph. */
  overrides: Overrides

  // UI state
  activeView: ViewId
  activeSnapshot: string
  selected: Selection | null
  hoveredId: string | null
  roleFilter: Role | null
  alertsOpen: boolean
  snapMenuOpen: boolean

  // Derived
  /** Live data = seed + overrides. */
  liveData: () => WorkspaceData
  /** What the views render: live when on "current", else the frozen snapshot. */
  currentData: () => WorkspaceData
  isReadOnly: () => boolean

  // Navigation
  setView: (v: ViewId) => void
  select: (sel: Selection | null) => void
  clearSelection: () => void
  setHovered: (id: string | null) => void

  // Editing (SSOT) — no-ops while viewing a historical snapshot or on bad refs
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
      overrides: emptyOverrides(),
      activeView: 'swimlane',
      activeSnapshot: 'current',
      selected: null,
      hoveredId: null,
      roleFilter: null,
      alertsOpen: false,
      snapMenuOpen: false,

      liveData: () => applyOverrides(get().overrides),
      currentData: () => {
        const { activeSnapshot } = get()
        return activeSnapshot === 'current' ? applyOverrides(get().overrides) : getSnapshot(activeSnapshot)
      },
      isReadOnly: () => get().activeSnapshot !== 'current',

      setView: (v) => set({ activeView: v, selected: null, hoveredId: null, alertsOpen: false, snapMenuOpen: false }),
      select: (sel) => set({ selected: sel }),
      clearSelection: () => set({ selected: null }),
      setHovered: (id) => set({ hoveredId: id }),

      setFeatureStatus: (id, status) => {
        if (get().isReadOnly() || !hasFeature(id)) return
        set((s) => ({ overrides: { ...s.overrides, featureStatus: { ...s.overrides.featureStatus, [id]: status } } }))
      },
      setSwimStatus: (id, status) => {
        if (get().isReadOnly() || !hasSwimNode(id)) return
        set((s) => ({ overrides: { ...s.overrides, swimStatus: { ...s.overrides.swimStatus, [id]: status } } }))
      },
      moveFeatureToRelease: (id, releaseId) => {
        // Reject unknown feature/release so a card can never be moved into a void.
        if (get().isReadOnly() || !hasFeature(id) || !hasRelease(releaseId)) return
        set((s) => ({ overrides: { ...s.overrides, featureRelease: { ...s.overrides.featureRelease, [id]: releaseId } } }))
      },

      setSnapshot: (id) => set({ activeSnapshot: id, snapMenuOpen: false, selected: null, hoveredId: null }),
      setRoleFilter: (role) => set({ roleFilter: role }),
      toggleAlerts: (open) => set((s) => ({ alertsOpen: open ?? !s.alertsOpen, snapMenuOpen: false })),
      toggleSnapMenu: (open) => set((s) => ({ snapMenuOpen: open ?? !s.snapMenuOpen, alertsOpen: false })),
      resetData: () => set({ overrides: emptyOverrides(), activeSnapshot: 'current', selected: null, hoveredId: null }),
    }),
    {
      name: 'kinetrak-workspace',
      version: PERSIST_VERSION,
      partialize: (s) => ({
        overrides: s.overrides,
        activeView: s.activeView,
        activeSnapshot: s.activeSnapshot,
        roleFilter: s.roleFilter,
      }),
      // On an incompatible version bump, drop persisted edits and fall back to seed defaults.
      migrate: () => ({}) as Partial<WorkspaceState>,
      // Defend against partially-shaped persisted overrides (older / corrupt storage).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WorkspaceState>
        const ov = p.overrides
        return {
          ...current,
          ...p,
          overrides: {
            featureStatus: ov?.featureStatus ?? {},
            featureRelease: ov?.featureRelease ?? {},
            swimStatus: ov?.swimStatus ?? {},
          },
        }
      },
    },
  ),
)
