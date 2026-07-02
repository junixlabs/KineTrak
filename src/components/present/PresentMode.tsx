import { useEffect } from 'react'
import { X, LineChart } from 'lucide-react'
import ViewTabs from '@/components/shell/ViewTabs'
import MindmapView from '@/components/views/MindmapView'
import StoryMapView from '@/components/views/StoryMapView'
import SwimlaneView from '@/components/views/SwimlaneView'
import OverviewView from '@/components/views/OverviewView'
import { useWorkspace } from '@/store/useWorkspace'

export default function PresentMode() {
  const activeView = useWorkspace((s) => s.activeView)
  const setPresent = useWorkspace((s) => s.setPresent)
  const project = useWorkspace((s) => s.activeProject())

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresent(false)
    }
    const onFs = () => {
      if (!document.fullscreenElement) setPresent(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
  }, [setPresent])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="z-40 flex h-12 flex-none items-center gap-3 border-b border-line bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-gradient-to-br from-brand to-brand-light">
            <LineChart size={14} className="text-white" strokeWidth={2.4} />
          </div>
          <span className="text-[13px] font-bold text-ink">{project?.name ?? 'KineTrak'}</span>
          <span className="rounded-full bg-[#fdecec] px-2 py-0.5 text-[10px] font-bold text-[#e5484d]">PRESENTING</span>
        </div>
        <div className="flex-1" />
        <ViewTabs />
        <div className="flex-1" />
        <button
          onClick={() => setPresent(false)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f4f6f9]"
        >
          <X size={15} strokeWidth={2.2} /> Exit (Esc)
        </button>
      </header>
      <main className="kt-canvas relative flex-1 overflow-hidden">
        {activeView === 'mindmap' && <MindmapView />}
        {activeView === 'story' && <StoryMapView />}
        {activeView === 'swimlane' && <SwimlaneView />}
        {activeView === 'overview' && <OverviewView />}
      </main>
    </div>
  )
}
