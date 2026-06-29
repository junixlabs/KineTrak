import { useWorkspace, setCommandPusher } from './useWorkspace'
import type { Command, Root } from '@/shared/board'

// Dev (Vite on :5173) → talk to the server on :8787.
// Production (served by the server itself) → same origin.
export const SYNC_URL =
  (import.meta.env.VITE_SYNC_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:8787' : window.location.origin)

let ws: WebSocket | null = null
let started = false

/** Connect the client to the KineTrak server when one is reachable; otherwise stay local. */
export function initSync() {
  if (started) return
  started = true
  void connect()
}

async function connect() {
  useWorkspace.getState().setSyncStatus('connecting')
  try {
    const res = await fetch(`${SYNC_URL}/api/state`)
    if (!res.ok) throw new Error('server unavailable')
    const root: Root = await res.json()
    useWorkspace.getState().applyServerRoot(root)
    setCommandPusher(pushToServer)
    useWorkspace.getState().setSyncStatus('live')
    openWs()
  } catch {
    // No server → run fully local (localStorage), no command pushing.
    setCommandPusher(() => {})
    useWorkspace.getState().setSyncStatus('local')
  }
}

function openWs() {
  const url = SYNC_URL.replace(/^http/, 'ws') + '/ws'
  ws = new WebSocket(url)
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg?.type === 'state') useWorkspace.getState().applyServerRoot(msg.root as Root)
    } catch {
      /* ignore malformed frames */
    }
  }
  ws.onclose = () => {
    ws = null
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
    await fetch(`${SYNC_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    })
  } catch {
    // Offline — local optimistic state stands; server reconciles on reconnect.
  }
}
