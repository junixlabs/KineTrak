import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { keyRepo } from './infra/repositories'

// ── API keys for MCP access ──────────────────────────────────────────────────
// Each key belongs to a user and is scoped to one org (workspace). An agent using
// the key acts as that user, limited to that org's projects. Keys are HASHED at
// rest (sha-256) — the raw secret is shown once on creation and never stored.
// `keyPrefix` is a non-secret label so the UI can identify a key. An in-RAM cache
// (warmed at boot) serves the synchronous verify path.

/** Public, secret-free view of a key (what the API returns when listing). */
export interface ApiKey {
  id: string
  userId: string
  orgId: string
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
}

interface KeyRecord extends ApiKey {
  hash: string
}

let keys: KeyRecord[] = []

/** Warm the in-RAM cache from Postgres. Called once at boot. */
export async function hydrateKeys(): Promise<void> {
  const rows = await keyRepo.all()
  keys = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    orgId: r.orgId,
    name: r.name,
    keyPrefix: r.keyPrefix,
    createdAt: r.createdAt,
    lastUsedAt: r.lastUsedAt,
    hash: r.keyHash,
  }))
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex')
const newSecret = (): string => `kt_live_${randomBytes(24).toString('hex')}`

/** Derive the at-rest representation of a raw key secret (hash + shown-once
 *  prefix label). Shared with the file→Postgres importer so they never diverge. */
export function hashSecret(secret: string): { keyHash: string; keyPrefix: string } {
  return { keyHash: sha256(secret), keyPrefix: secret.slice(0, 14) }
}
const toPublic = (k: KeyRecord): ApiKey => ({
  id: k.id,
  userId: k.userId,
  orgId: k.orgId,
  name: k.name,
  keyPrefix: k.keyPrefix,
  createdAt: k.createdAt,
  lastUsedAt: k.lastUsedAt,
})

/** Keys owned by a user, optionally filtered to one org (no secret). */
export function listKeys(userId: string, orgId?: string): ApiKey[] {
  return keys.filter((k) => k.userId === userId && (!orgId || k.orgId === orgId)).map(toPublic)
}

/** Create a key. Returns the public record plus the raw `secret` (shown once). */
export async function createKey(userId: string, orgId: string, name?: string): Promise<ApiKey & { secret: string }> {
  const secret = newSecret()
  const { keyHash, keyPrefix } = hashSecret(secret)
  const k: KeyRecord = {
    id: randomUUID(),
    userId,
    orgId,
    name: (name?.trim() || 'Agent key').slice(0, 80),
    keyPrefix,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    hash: keyHash,
  }
  await keyRepo.insert({
    id: k.id,
    userId: k.userId,
    orgId: k.orgId,
    name: k.name,
    keyHash: k.hash,
    keyPrefix: k.keyPrefix,
    createdAt: k.createdAt,
    lastUsedAt: null,
  })
  keys.unshift(k)
  return { ...toPublic(k), secret }
}

/** Revoke a key the user owns. Returns false if not found / not theirs. */
export async function revokeKey(userId: string, id: string): Promise<boolean> {
  const k = keys.find((x) => x.id === id)
  if (!k || k.userId !== userId) return false
  keys = keys.filter((x) => x.id !== id)
  await keyRepo.delete(id)
  return true
}

const eq = (a: string, b: string): boolean => {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Match a raw bearer token against the hashed keys; returns the public record on
 *  a hit. Stays synchronous — `lastUsedAt` is updated write-behind. */
export function verifyKey(raw: string | undefined): ApiKey | null {
  if (!raw) return null
  const incomingHash = sha256(raw)
  for (const k of keys) {
    if (eq(k.hash, incomingHash)) {
      const at = new Date().toISOString()
      k.lastUsedAt = at
      keyRepo.touch(k.id, at).catch((e) => console.error('key touch failed:', e))
      return toPublic(k)
    }
  }
  return null
}

/** Drop every key for an org from the RAM cache (the FK cascade already removed
 *  the rows in Postgres). Used when an org is deleted. */
export function revokeOrgKeys(orgId: string) {
  keys = keys.filter((k) => k.orgId !== orgId)
}

/** Pull a bearer token from an Authorization / X-API-Key header. */
export function bearerFrom(headers: Record<string, unknown>): string | undefined {
  const auth = headers['authorization']
  if (typeof auth === 'string') {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (m) return m[1].trim()
  }
  const x = headers['x-api-key']
  return typeof x === 'string' ? x.trim() : undefined
}
