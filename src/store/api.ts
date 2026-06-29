// Base URL + bearer-token helpers shared by the auth and sync layers.
// The session token lives in localStorage and rides on Authorization headers,
// so there are no cross-origin cookie headaches between Vite (:5173) and the
// server (:8787).

// Dev (Vite on :5173) → talk to the server on :8787.
// Production (served by the server itself) → same origin.
export const SYNC_URL =
  (import.meta.env.VITE_SYNC_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:8787' : window.location.origin)

const TOKEN_KEY = 'kt_token'
let token: string | null = localStorage.getItem(TOKEN_KEY)

export const getToken = () => token
export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

/** fetch against the server with the bearer token attached when present. */
export function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${SYNC_URL}${path}`, { ...init, headers })
}

/** A public read-only share token from the URL: /share/<token> or ?share=<token>. */
export function getShareToken(): string | null {
  const m = /^\/share\/([^/?#]+)/.exec(window.location.pathname)
  if (m) return decodeURIComponent(m[1])
  return new URLSearchParams(window.location.search).get('share')
}
