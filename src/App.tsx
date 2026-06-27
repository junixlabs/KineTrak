import Header from '@/components/shell/Header'
import SnapshotBanner from '@/components/shell/SnapshotBanner'
import MindmapView from '@/components/views/MindmapView'
import StoryMapView from '@/components/views/StoryMapView'
import SwimlaneView from '@/components/views/SwimlaneView'
import DetailPanel from '@/components/panel/DetailPanel'
import { useWorkspace } from '@/store/useWorkspace'

export default function App() {
  const activeView = useWorkspace((s) => s.activeView)

  return (
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
  )
}
