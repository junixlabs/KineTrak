import Header from '@/components/shell/Header'
import SnapshotBanner from '@/components/shell/SnapshotBanner'
import MindmapView from '@/components/views/MindmapView'
import StoryMapView from '@/components/views/StoryMapView'
import SwimlaneView from '@/components/views/SwimlaneView'
import DetailPanel from '@/components/panel/DetailPanel'
import Home from '@/components/home/Home'
import PresentMode from '@/components/present/PresentMode'
import Toaster from '@/components/ui/Toaster'
import { useWorkspace } from '@/store/useWorkspace'

export default function App() {
  const screen = useWorkspace((s) => s.screen)
  const present = useWorkspace((s) => s.present)
  const activeView = useWorkspace((s) => s.activeView)

  return (
    <>
      {present ? (
        <PresentMode />
      ) : screen === 'home' ? (
        <Home />
      ) : (
        <div className="flex h-full flex-col overflow-hidden">
          <Header />
          <SnapshotBanner />
          <main className="kt-canvas relative flex-1 overflow-hidden">
            {activeView === 'mindmap' && <MindmapView />}
            {activeView === 'story' && <StoryMapView />}
            {activeView === 'swimlane' && <SwimlaneView />}
            <DetailPanel />
          </main>
        </div>
      )}
      <Toaster />
    </>
  )
}
