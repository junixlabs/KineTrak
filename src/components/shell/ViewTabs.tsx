import { Network, LayoutGrid, Workflow } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'
import type { ViewId } from '@/store/types'

const TABS: { id: ViewId; label: string; Icon: typeof Network }[] = [
  { id: 'mindmap', label: 'Mindmap', Icon: Network },
  { id: 'story', label: 'Story Map', Icon: LayoutGrid },
  { id: 'swimlane', label: 'Swimlane', Icon: Workflow },
]

const TAB_W = 124

export default function ViewTabs() {
  const activeView = useWorkspace((s) => s.activeView)
  const setView = useWorkspace((s) => s.setView)
  const idx = TABS.findIndex((t) => t.id === activeView)

  return (
    <div className="relative flex items-center gap-1 rounded-[10px] bg-[#f1f3f6] p-1">
      <div
        className="absolute bottom-1 top-1 rounded-lg bg-white shadow-[0_1px_2px_rgba(20,24,31,.10)] transition-[left,width] duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ left: 4 + idx * TAB_W, width: TAB_W }}
      />
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          className="relative z-[1] flex h-[30px] items-center justify-center gap-[7px] whitespace-nowrap text-[13px] font-semibold"
          style={{ width: TAB_W, color: activeView === id ? '#14181f' : '#5b6470' }}
        >
          <Icon size={15} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  )
}
