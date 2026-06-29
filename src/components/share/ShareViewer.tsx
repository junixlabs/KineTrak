import { Eye, LineChart } from 'lucide-react'
import ViewTabs from '@/components/shell/ViewTabs'
import ActivityPanel from '@/components/shell/ActivityPanel'
import MindmapView from '@/components/views/MindmapView'
import StoryMapView from '@/components/views/StoryMapView'
import SwimlaneView from '@/components/views/SwimlaneView'
import DetailPanel from '@/components/panel/DetailPanel'
import { useWorkspace } from '@/store/useWorkspace'

/**
 * Anonymous, read-only viewer for a public share link. Reuses the three live
 * views (read-only via isReadOnly()) with a minimal "shared" chrome — no login,
 * no editing, no fullscreen takeover.
 */
export default function ShareViewer() {
  const activeView = useWorkspace((s) => s.activeView)
  const project = useWorkspace((s) => s.activeProject())

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="z-40 flex h-12 flex-none items-center gap-3 border-b border-line bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-gradient-to-br from-brand to-brand-light">
            <LineChart size={14} className="text-white" strokeWidth={2.4} />
          </div>
          <span className="text-[13px] font-bold text-ink">{project?.name ?? 'KineTrak'}</span>
          <span className="flex items-center gap-1 rounded-full bg-[#eef1ff] px-2 py-0.5 text-[10px] font-bold text-brand">
            <Eye size={11} strokeWidth={2.4} /> READ-ONLY
          </span>
        </div>
        <div className="flex-1" />
        <ViewTabs />
        <div className="flex-1" />
        <ActivityPanel />
        <span className="text-[11px] font-semibold text-faint">Shared · live</span>
      </header>
      <main className="kt-canvas relative flex-1 overflow-hidden">
        {activeView === 'mindmap' && <MindmapView />}
        {activeView === 'story' && <StoryMapView />}
        {activeView === 'swimlane' && <SwimlaneView />}
        <DetailPanel />
      </main>
    </div>
  )
}
