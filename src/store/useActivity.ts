import { create } from 'zustand'

export interface Activity {
  id: string
  projectId: string
  ts: number
  actor: { kind: 'agent' | 'human'; name: string }
  summary: string
  targetId?: string
  kind: 'change' | 'note'
}

const SEEN_KEY = 'kt_activity_seen'
const loadSeen = (): number => Number(localStorage.getItem(SEEN_KEY)) || 0

interface ActivityState {
  items: Activity[]
  lastSeenTs: number
  setItems: (items: Activity[]) => void
  addItem: (item: Activity) => void
  markAllSeen: () => void
  /** ids of nodes changed since the human last looked — drives the "recent" glow. */
  recentIds: () => Set<string>
  unseenCount: () => number
  reset: () => void
}

export const useActivity = create<ActivityState>((set, get) => ({
  items: [],
  lastSeenTs: loadSeen(),
  setItems: (items) => set({ items: items.slice(-200) }),
  addItem: (item) =>
    set((s) => (s.items.some((i) => i.id === item.id) ? s : { items: [...s.items, item].slice(-200) })),
  markAllSeen: () => {
    const ts = get().items.at(-1)?.ts ?? Date.now()
    localStorage.setItem(SEEN_KEY, String(ts))
    set({ lastSeenTs: ts })
  },
  recentIds: () => {
    const seen = get().lastSeenTs
    const ids = new Set<string>()
    get().items.forEach((i) => {
      if (i.ts > seen && i.targetId) ids.add(i.targetId)
    })
    return ids
  },
  unseenCount: () => {
    const seen = get().lastSeenTs
    return get().items.filter((i) => i.ts > seen).length
  },
  reset: () => set({ items: [] }),
}))
