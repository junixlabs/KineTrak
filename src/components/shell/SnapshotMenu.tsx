import { Clock, ChevronDown } from 'lucide-react'
import { useWorkspace } from '@/store/useWorkspace'

export default function SnapshotMenu() {
  const data = useWorkspace((s) => s.data)
  const activeSnapshot = useWorkspace((s) => s.activeSnapshot)
  const snapMenuOpen = useWorkspace((s) => s.snapMenuOpen)
  const toggleSnapMenu = useWorkspace((s) => s.toggleSnapMenu)
  const setSnapshot = useWorkspace((s) => s.setSnapshot)

  const cur = data.snapshots.find((s) => s.id === activeSnapshot) ?? data.snapshots[0]
  const label = cur.id === 'current' ? 'Live' : cur.name

  return (
    <div className="relative">
      <button
        onClick={() => toggleSnapMenu()}
        className="flex h-8 items-center gap-2 rounded-lg border border-line bg-white px-[11px] hover:bg-[#f4f6f9]"
      >
        <Clock size={13} className="text-muted" strokeWidth={2} />
        <span className="text-[12.5px] font-semibold text-muted">{label}</span>
        <ChevronDown size={11} className="text-faint" strokeWidth={2.4} />
      </button>

      {snapMenuOpen && (
        <div className="absolute left-0 top-[38px] z-[60] w-[268px] animate-pop rounded-xl border border-line bg-white p-1.5 shadow-pop">
          <div className="px-2.5 pb-1.5 pt-2 text-[10.5px] font-bold tracking-wide text-faint">
            SNAPSHOT &amp; VERSION CONTROL
          </div>
          {data.snapshots.map((snap) => (
            <button
              key={snap.id}
              onClick={() => setSnapshot(snap.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-left hover:bg-[#f4f6f9]"
              style={{ background: snap.id === activeSnapshot ? '#f4f6f9' : 'transparent' }}
            >
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: snap.dot }} />
              <span className="flex flex-1 flex-col gap-px">
                <span className="text-[12.5px] font-semibold text-ink">{snap.name}</span>
                <span className="font-mono text-[11px] text-faint">{snap.date}</span>
              </span>
              <span
                className="rounded-full px-[7px] py-0.5 text-[10px] font-bold"
                style={{ color: snap.tagColor, background: snap.tagBg }}
              >
                {snap.tag}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
