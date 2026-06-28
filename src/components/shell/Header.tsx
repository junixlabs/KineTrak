import { Play, LineChart } from 'lucide-react'
import ViewTabs from './ViewTabs'
import SnapshotMenu from './SnapshotMenu'
import RoleFilter from './RoleFilter'
import AlertsPanel from './AlertsPanel'
import ProjectSwitcher from './ProjectSwitcher'
import ShareMenu from './ShareMenu'
import { useWorkspace } from '@/store/useWorkspace'

const SYNC_META = {
  live: { label: 'Live · synced', dot: '#16a34a', color: '#0f7a44', bg: '#e7f6ee' },
  connecting: { label: 'Connecting…', dot: '#f59e0b', color: '#8a6d1f', bg: '#fef3e2' },
  local: { label: 'Local', dot: '#9aa2ad', color: '#5b6470', bg: '#eef0f3' },
} as const

export default function Header() {
  const goHome = useWorkspace((s) => s.goHome)
  const setPresent = useWorkspace((s) => s.setPresent)
  const syncStatus = useWorkspace((s) => s.syncStatus)
  const sync = SYNC_META[syncStatus]
  return (
    <header className="z-40 flex h-14 flex-none items-center gap-3.5 border-b border-line bg-white px-4">
      {/* Logo — click to go back Home */}
      <button onClick={goHome} className="flex items-center gap-2.5 rounded-lg p-0.5 hover:opacity-80" title="Home">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand to-brand-light shadow-[0_2px_6px_rgba(47,111,237,.35)]">
          <LineChart size={17} className="text-white" strokeWidth={2.4} />
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[15px] font-extrabold tracking-tight">KineTrak</span>
          <span className="mt-0.5 text-[8.5px] font-bold tracking-[2px] text-faint">PLATFORM</span>
        </div>
      </button>

      <div className="h-6 w-px bg-line" />

      <ProjectSwitcher />
      <SnapshotMenu />
      <span
        title={syncStatus === 'live' ? 'Connected to the KineTrak server — agents can co-edit and changes appear live' : syncStatus === 'local' ? 'No server — changes stay in this browser' : 'Connecting to the server…'}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold"
        style={{ color: sync.color, background: sync.bg }}
      >
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: sync.dot }} />
        {sync.label}
      </span>

      <div className="flex-1" />
      <ViewTabs />
      <div className="flex-1" />

      <RoleFilter />
      <AlertsPanel />

      <button
        onClick={() => setPresent(true)}
        className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]"
      >
        <Play size={14} className="fill-brand text-brand" />
        Present
      </button>

      {/* Avatar stack */}
      <div className="flex items-center">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-brand-light text-[11px] font-bold text-white">
          PA
        </div>
        <div className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#16a34a] text-[11px] font-bold text-white">
          BA
        </div>
        <div className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-amber text-[11px] font-bold text-white">
          DV
        </div>
      </div>

      <ShareMenu />
    </header>
  )
}
