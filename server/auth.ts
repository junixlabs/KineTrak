import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { sessionRepo, userRepo } from './infra/repositories'

// ── User accounts + sessions ─────────────────────────────────────────────────
// Self-contained email/password auth. Passwords hashed with scrypt (node:crypto,
// no extra deps). Sessions are opaque bearer tokens persisted in Postgres; the
// client stores the token in localStorage and sends it as `Authorization: Bearer`.
// An in-RAM cache (warmed at boot) serves the synchronous token lookup.

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

let users: User[] = []
let sessions: Session[] = []

/** Warm the in-RAM caches from Postgres. Called once at boot. */
export async function hydrateAuth(): Promise<void> {
  users = await userRepo.all()
  const rows = await sessionRepo.all()
  sessions = rows.map((r) => ({ token: r.token, userId: r.userId, expiresAt: r.expiresAt }))
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

export async function register(email: string, name: string, password: string): Promise<{ token: string; user: PublicUser }> {
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
  await userRepo.insert(user)
  return { token: await createSession(user.id), user: toPublic(user) }
}

export async function login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
  const u = users.find((x) => x.email === normEmail(email || ''))
  if (!u || !verifyPassword(password || '', u)) throw new AuthError('Wrong email or password', 401)
  return { token: await createSession(u.id), user: toPublic(u) }
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expired = sessions.filter((s) => s.expiresAt <= Date.now()).map((s) => s.token)
  sessions = sessions.filter((s) => s.expiresAt > Date.now()) // prune expired
  const session: Session = { token, userId, expiresAt: Date.now() + SESSION_TTL_MS }
  sessions.push(session)
  if (expired.length) await sessionRepo.deleteMany(expired)
  await sessionRepo.insert(session)
  return token
}

export async function logout(token: string | undefined) {
  if (!token) return
  const before = sessions.length
  sessions = sessions.filter((s) => s.token !== token)
  if (sessions.length === before) return
  await sessionRepo.delete(token)
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

/** Delete an account and everything it owns (cascade). Used to roll back a
 *  registration whose workspace seeding failed, so the email stays re-usable. */
export async function deleteAccount(userId: string): Promise<void> {
  users = users.filter((u) => u.id !== userId)
  sessions = sessions.filter((s) => s.userId !== userId)
  await userRepo.delete(userId)
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
