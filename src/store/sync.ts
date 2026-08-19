import { useWorkspace, setCommandPusher } from './useWorkspace'
import { useActivity, type Activity } from './useActivity'
import { useToast } from './useToast'
import { SYNC_URL, authFetch, getToken } from './api'
import type { Command, Root } from '@/shared/board'
import type { OrgBoard, Project } from '../shared/types'

/** Pull the activity history for the active project (newest 200). */
export async function refreshActivity() {
  const pid = useWorkspace.getState().activeProjectId
  if (!pid) return
  try {
    const res = await authFetch(`/api/projects/${pid}/activity`)
    if (res.ok) useActivity.getState().setItems((await res.json()).items ?? [])
  } catch {
    /* ignore */
  }
}

/** Apply a live activity frame: append, and toast when an agent is at work. */
export function ingestActivity(item: Activity) {
  if (item.projectId !== useWorkspace.getState().activeProjectId) return
  const known = useActivity.getState().items.some((i) => i.id === item.id)
  useActivity.getState().addItem(item)
  if (!known && item.actor.kind === 'agent') useToast.getState().show(`${item.actor.name} ${item.summary}`)
}

let ws: WebSocket | null = null
let running = false

/** Start syncing the authenticated user's board with the server. */
export function startSync() {
  if (running) return
  running = true
  void connect()
}

/** Tear down sync (on logout). */
export function stopSync() {
  running = false
  setCommandPusher(() => {})
  useWorkspace.getState().setSyncStatus('local')
  if (ws) {
    try {
      ws.close()
    } catch {
      /* noop */
    }
    ws = null
  }
}

async function connect() {
  if (!running) return
  useWorkspace.getState().setSyncStatus('connecting')
  try {
    const res = await authFetch('/api/state')
    if (res.status === 401) return onUnauthorized()
    if (!res.ok) throw new Error('server unavailable')
    const root: Root = await res.json()
    useWorkspace.getState().applyServerRoot(root)
    setCommandPusher(pushToServer)
    useWorkspace.getState().setSyncStatus('live')
    void refreshActivity()
    openWs()
  } catch {
    // Lost the server — keep optimistic local state, retry shortly.
    setCommandPusher(() => {})
    useWorkspace.getState().setSyncStatus('connecting')
    if (running) setTimeout(() => void connect(), 1500)
  }
}

function onUnauthorized() {
  // Session expired/revoked — drop to the login screen.
  void import('./auth').then((m) => m.handleAuthExpired())
}

function openWs() {
  const token = getToken()
  const url = SYNC_URL.replace(/^http/, 'ws') + '/ws' + (token ? `?token=${encodeURIComponent(token)}` : '')
  ws = new WebSocket(url)
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg?.type === 'state') useWorkspace.getState().applyServerRoot(msg.root as Root)
      else if (msg?.type === 'project') useWorkspace.getState().applyServerProject(msg.project as Project)
      else if (msg?.type === 'orgboard') useWorkspace.getState().applyServerOrgBoard(msg.board as OrgBoard)
      else if (msg?.type === 'activity') ingestActivity(msg.item as Activity)
    } catch {
      /* ignore malformed frames */
    }
  }
  ws.onclose = (e) => {
    ws = null
    if (!running) return
    if (e.code === 4001) return onUnauthorized() // server rejected the token
    useWorkspace.getState().setSyncStatus('connecting')
    setTimeout(() => void connect(), 1500)
  }
  ws.onerror = () => {
    try {
      ws?.close()
    } catch {
      /* noop */
    }
  }
}

async function pushToServer(cmd: Command) {
  try {
    const res = await authFetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    })
    if (res.status === 401) onUnauthorized()
  } catch {
    // Offline — local optimistic state stands; server reconciles on reconnect.
  }
}
