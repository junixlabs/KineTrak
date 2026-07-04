import { useWorkspace } from './useWorkspace'
import { useActivity, type Activity } from './useActivity'
import { SYNC_URL } from './api'
import type { OrgBoard, WorkspaceData } from './types'

/**
 * Open the app as an anonymous, read-only viewer for a public share token.
 * Loads the project once, then keeps it live over a public WS (no login).
 * Returns false if the link is invalid/revoked so the caller can fall back.
 */
export async function bootstrapShare(token: string): Promise<boolean> {
  const s = useWorkspace.getState()
  try {
    const res = await fetch(`${SYNC_URL}/api/shared/${encodeURIComponent(token)}`)
    if (!res.ok) throw new Error('invalid share')
    const proj = (await res.json()) as { id: string; name: string; data: WorkspaceData }
    loadSharedProject(proj)
    s.setShareMode(true)
    s.setServerPresent(true)
    s.setAuthChecked(true)
    openShareWs(token)
    return true
  } catch {
    return false
  }
}

function loadSharedProject(proj: { id: string; name: string; data: WorkspaceData }) {
  useWorkspace.setState({
    orgs: [],
    projects: [{ id: proj.id, orgId: 'shared', name: proj.name, createdAt: '', data: proj.data, snapshots: [] }],
    activeProjectId: proj.id,
    screen: 'workspace',
    syncStatus: 'live',
  })
}

/**
 * Open the app as an anonymous, read-only viewer for a public SYSTEM MAP link.
 * Loads the org board once, then keeps it live over a public WS (no login).
 */
export async function bootstrapMapShare(token: string): Promise<boolean> {
  const s = useWorkspace.getState()
  try {
    const res = await fetch(`${SYNC_URL}/api/shared-map/${encodeURIComponent(token)}`)
    if (!res.ok) throw new Error('invalid share')
    const { board, orgName } = (await res.json()) as { board: OrgBoard; orgName: string }
    useWorkspace.setState({
      orgs: [{ id: board.orgId, name: orgName }],
      projects: [],
      orgBoards: [board],
      activeOrgBoardId: board.id,
      activeProjectId: null,
      screen: 'orgboard',
      syncStatus: 'live',
    })
    s.setShareMode(true)
    s.setServerPresent(true)
    s.setAuthChecked(true)
    openMapShareWs(token)
    return true
  } catch {
    return false
  }
}

function openMapShareWs(token: string) {
  const url = SYNC_URL.replace(/^http/, 'ws') + '/ws?map=' + encodeURIComponent(token)
  let ws: WebSocket | null = new WebSocket(url)
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg?.type === 'orgboard' && msg.board) useWorkspace.getState().applyServerOrgBoard(msg.board as OrgBoard)
    } catch {
      /* ignore */
    }
  }
  ws.onclose = () => {
    ws = null
    setTimeout(() => openMapShareWs(token), 2000)
  }
  ws.onerror = () => {
    try {
      ws?.close()
    } catch {
      /* noop */
    }
  }
}

function openShareWs(token: string) {
  const url = SYNC_URL.replace(/^http/, 'ws') + '/ws?share=' + encodeURIComponent(token)
  let ws: WebSocket | null = new WebSocket(url)
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      const proj = msg?.root?.projects?.[0]
      if (msg?.type === 'state' && proj) {
        useWorkspace.setState((st) => ({ projects: st.projects.map((p) => (p.id === proj.id ? proj : p)) }))
      } else if (msg?.type === 'activity') {
        useActivity.getState().addItem(msg.item as Activity)
      }
    } catch {
      /* ignore */
    }
  }
  ws.onclose = () => {
    ws = null
    // The viewer is read-only; a quiet reconnect keeps the present link live.
    setTimeout(() => openShareWs(token), 2000)
  }
  ws.onerror = () => {
    try {
      ws?.close()
    } catch {
      /* noop */
    }
  }
}
