import Header from '@/components/shell/Header'
import SnapshotBanner from '@/components/shell/SnapshotBanner'
import MindmapView from '@/components/views/MindmapView'
import StoryMapView from '@/components/views/StoryMapView'
import SwimlaneView from '@/components/views/SwimlaneView'
import OverviewView from '@/components/views/OverviewView'
import OrgBoardView from '@/components/views/OrgBoardView'
import DetailPanel from '@/components/panel/DetailPanel'
import Home from '@/components/home/Home'
import ConnectPage from '@/components/connect/ConnectPage'
import GuidePage from '@/components/guide/GuidePage'
import PresentMode from '@/components/present/PresentMode'
import AuthScreen from '@/components/auth/AuthScreen'
import ShareViewer from '@/components/share/ShareViewer'
import Toaster from '@/components/ui/Toaster'
import { useWorkspace } from '@/store/useWorkspace'

export default function App() {
  const screen = useWorkspace((s) => s.screen)
  const present = useWorkspace((s) => s.present)
  const activeView = useWorkspace((s) => s.activeView)
  const serverPresent = useWorkspace((s) => s.serverPresent)
  const currentUser = useWorkspace((s) => s.currentUser)
  const authChecked = useWorkspace((s) => s.authChecked)
  const shareMode = useWorkspace((s) => s.shareMode)

  // Anonymous read-only share link — no login, present-style viewer.
  // A system-map link opens the org-board view itself (read-only via shareMode);
  // project links keep the per-project ShareViewer.
  if (shareMode) {
    return (
      <>
        {screen === 'orgboard' ? <OrgBoardView /> : <ShareViewer />}
        <Toaster />
      </>
    )
  }

  // When a server is present, accounts are required — gate the app behind login.
  // (No server → local-only mode, no accounts.)
  if (!authChecked) return <div className="h-full bg-[#f6f8fb]" />
  if (serverPresent && !currentUser) {
    return (
      <>
        <AuthScreen />
        <Toaster />
      </>
    )
  }

  return (
    <>
      {present && screen === 'orgboard' ? (
        // Org boards present themselves (PresentMode assumes a per-project view).
        <OrgBoardView />
      ) : present ? (
        <PresentMode />
      ) : screen === 'home' ? (
        <Home />
      ) : screen === 'connect' ? (
        <ConnectPage />
      ) : screen === 'guide' ? (
        <GuidePage />
      ) : screen === 'orgboard' ? (
        <OrgBoardView />
      ) : (
        <div className="flex h-full flex-col overflow-hidden">
          <Header />
          <SnapshotBanner />
          <main className="kt-canvas relative flex-1 overflow-hidden">
            {activeView === 'mindmap' && <MindmapView />}
            {activeView === 'story' && <StoryMapView />}
            {activeView === 'swimlane' && <SwimlaneView />}
            {activeView === 'overview' && <OverviewView />}
            <DetailPanel />
          </main>
        </div>
      )}
      <Toaster />
    </>
  )
}
