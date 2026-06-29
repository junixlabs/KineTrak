import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'

// ── User accounts + sessions ─────────────────────────────────────────────────
// Self-contained email/password auth. Passwords hashed with scrypt (node:crypto,
// no extra deps). Sessions are opaque bearer tokens kept server-side; the client
// stores the token in localStorage and sends it as `Authorization: Bearer`.
// These files are NEVER part of the synced board Root sent to browsers.

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const USERS_FILE = join(DATA_DIR, 'users.json')
const SESS_FILE = join(DATA_DIR, 'sessions.json')

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export interface User {
  id: string
  email: string
  name: string
  salt: string
  hash: string
  role: 'admin' | 'user'
  createdAt: string
}
export interface PublicUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}
interface Session {
  token: string
  userId: string
  expiresAt: number
}

let users: User[] = readJson(USERS_FILE, [])
let sessions: Session[] = readJson(SESS_FILE, [])

function readJson<T>(file: string, fallback: T): T {
  if (existsSync(file)) {
    try {
      return JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      /* ignore */
    }
  }
  return fallback
}
function writeJson(file: string, data: unknown) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2))
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}
function verifyPassword(password: string, user: User): boolean {
  const candidate = Buffer.from(hashPassword(password, user.salt), 'hex')
  const known = Buffer.from(user.hash, 'hex')
  return candidate.length === known.length && timingSafeEqual(candidate, known)
}

export const toPublic = (u: User): PublicUser => ({ id: u.id, email: u.email, name: u.name, role: u.role })

export function userCount(): number {
  return users.length
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const normEmail = (e: string) => e.trim().toLowerCase()

export function register(email: string, name: string, password: string): { token: string; user: PublicUser } {
  const e = normEmail(email || '')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new AuthError('Enter a valid email')
  if (!password || password.length < 6) throw new AuthError('Password must be at least 6 characters')
  if (users.some((u) => u.email === e)) throw new AuthError('An account with this email already exists', 409)
  const salt = randomBytes(16).toString('hex')
  const user: User = {
    id: randomUUID(),
    email: e,
    name: (name || '').trim() || e.split('@')[0],
    salt,
    hash: hashPassword(password, salt),
    role: users.length === 0 ? 'admin' : 'user', // first account is the admin
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  writeJson(USERS_FILE, users)
  return { token: createSession(user.id), user: toPublic(user) }
}

export function login(email: string, password: string): { token: string; user: PublicUser } {
  const u = users.find((x) => x.email === normEmail(email || ''))
  if (!u || !verifyPassword(password || '', u)) throw new AuthError('Wrong email or password', 401)
  return { token: createSession(u.id), user: toPublic(u) }
}

function createSession(userId: string): string {
  const token = randomBytes(32).toString('hex')
  sessions = sessions.filter((s) => s.expiresAt > Date.now()) // prune expired
  sessions.push({ token, userId, expiresAt: Date.now() + SESSION_TTL_MS })
  writeJson(SESS_FILE, sessions)
  return token
}

export function logout(token: string | undefined) {
  if (!token) return
  const before = sessions.length
  sessions = sessions.filter((s) => s.token !== token)
  if (sessions.length !== before) writeJson(SESS_FILE, sessions)
}

/** Resolve a bearer session token to its user (null if missing/expired). */
export function userByToken(token: string | undefined): User | null {
  if (!token) return null
  const s = sessions.find((x) => x.token === token)
  if (!s || s.expiresAt <= Date.now()) return null
  return users.find((u) => u.id === s.userId) ?? null
}

export function userById(id: string): User | null {
  return users.find((u) => u.id === id) ?? null
}

/** Pull a bearer token from an Authorization header. */
export function bearerFrom(headers: Record<string, unknown>): string | undefined {
  const auth = headers['authorization']
  if (typeof auth === 'string') {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (m) return m[1].trim()
  }
  return undefined
}
