import { Play, LineChart } from 'lucide-react'
import ViewTabs from './ViewTabs'
import SnapshotMenu from './SnapshotMenu'
import RoleFilter from './RoleFilter'
import AlertsPanel from './AlertsPanel'
import ProjectSwitcher from './ProjectSwitcher'
import { useWorkspace } from '@/store/useWorkspace'

export default function Header() {
  const goHome = useWorkspace((s) => s.goHome)
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

      <div className="flex-1" />
      <ViewTabs />
      <div className="flex-1" />

      <RoleFilter />
      <AlertsPanel />

      <button className="flex h-[34px] items-center gap-[7px] rounded-[9px] border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]">
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

      <button className="h-[34px] rounded-[9px] bg-brand px-[15px] text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(47,111,237,.30)] hover:bg-brand-dark">
        Share
      </button>
    </header>
  )
}
