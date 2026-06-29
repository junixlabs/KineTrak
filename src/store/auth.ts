import { useWorkspace } from './useWorkspace'
import { authFetch, setToken, getToken } from './api'
import { startSync, stopSync } from './sync'
import type { User } from './types'

interface AuthResult {
  ok: boolean
  token?: string
  user?: User
  error?: string
}

async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await authFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: data?.error || 'Something went wrong' }
    return { ok: true, token: data.token, user: data.user }
  } catch {
    return { ok: false, error: 'Cannot reach the server' }
  }
}

function onSignedIn(user: User, token: string) {
  setToken(token)
  const s = useWorkspace.getState()
  s.setCurrentUser(user)
  s.setServerPresent(true)
  startSync()
}

export async function register(email: string, name: string, password: string): Promise<AuthResult> {
  const r = await postAuth('/api/auth/register', { email, name, password })
  if (r.ok && r.user && r.token) onSignedIn(r.user, r.token)
  return r
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const r = await postAuth('/api/auth/login', { email, password })
  if (r.ok && r.user && r.token) onSignedIn(r.user, r.token)
  return r
}

export async function logout() {
  try {
    await authFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    /* best effort */
  }
  setToken(null)
  stopSync()
  useWorkspace.getState().resetForLogout()
}

/** Called by the sync layer when the server rejects the token. */
export function handleAuthExpired() {
  setToken(null)
  stopSync()
  useWorkspace.getState().resetForLogout()
}

/**
 * On boot: is a KineTrak server reachable, and are we already signed in?
 * - server + valid token → restore the session and start syncing.
 * - server + no/expired token → show the auth screen.
 * - no server → local-only mode (no accounts; works offline in this browser).
 */
export async function bootstrapAuth() {
  const s = useWorkspace.getState()
  try {
    const health = await authFetch('/api/health')
    if (!health.ok) throw new Error('no server')
    s.setServerPresent(true)
    if (getToken()) {
      const me = await authFetch('/api/auth/me')
      if (me.ok) {
        const { user } = await me.json()
        s.setCurrentUser(user)
        startSync()
      } else {
        setToken(null)
      }
    }
  } catch {
    s.setServerPresent(false) // local-only mode
  } finally {
    s.setAuthChecked(true)
  }
}
