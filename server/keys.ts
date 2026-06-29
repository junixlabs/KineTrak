import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { isPgEnabled } from './infra/db'
import { keyRepo } from './infra/repositories'

// ── API keys for MCP access ──────────────────────────────────────────────────
// Each key belongs to a user and is scoped to one org (workspace). An agent using
// the key acts as that user, limited to that org's projects.
//
// In Postgres mode keys are HASHED at rest (sha-256) — the raw secret is shown
// once on creation and never stored. In legacy file-JSON mode the raw secret is
// kept (backward compatible with existing keys.json). `keyPrefix` is a non-secret
// label so the UI can identify a key without the secret.

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const FILE = join(DATA_DIR, 'keys.json')

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

interface StoredKey extends ApiKey {
  /** Raw secret — file mode only. */
  secret?: string
  /** sha-256 of the secret — Postgres mode. */
  hash?: string
}

let keys: StoredKey[] = isPgEnabled() ? [] : load()

function load(): StoredKey[] {
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
      if (Array.isArray(parsed)) {
        // Map both the new shape and the legacy {key} shape.
        return parsed.map((r: Record<string, unknown>): StoredKey => {
          const secret = (r.secret ?? r.key) as string | undefined
          return {
            id: r.id as string,
            userId: r.userId as string,
            orgId: r.orgId as string,
            name: r.name as string,
            keyPrefix: (r.keyPrefix as string) ?? (secret ? secret.slice(0, 14) : ''),
            createdAt: r.createdAt as string,
            lastUsedAt: (r.lastUsedAt as string | null) ?? null,
            secret,
            hash: r.hash as string | undefined,
          }
        })
      }
    } catch {
      /* ignore */
    }
  }
  return []
}
function persistFile() {
  mkdirSync(DATA_DIR, { recursive: true })
  // Persist the legacy `key` alias too so older readers keep working.
  const out = keys.map((k) => ({ ...k, key: k.secret }))
  writeFileSync(FILE, JSON.stringify(out, null, 2))
}

/** Warm the in-RAM cache from Postgres (Pg mode only). Called once at boot. */
export async function hydrateKeys(): Promise<void> {
  if (!isPgEnabled()) return
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
function newSecret(): string {
  return `kt_live_${randomBytes(24).toString('hex')}`
}
const toPublic = (k: StoredKey): ApiKey => ({
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
  const k: StoredKey = {
    id: randomUUID(),
    userId,
    orgId,
    name: (name?.trim() || 'Agent key').slice(0, 80),
    keyPrefix: secret.slice(0, 14),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }
  if (isPgEnabled()) {
    k.hash = sha256(secret)
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
  } else {
    k.secret = secret
  }
  keys.unshift(k)
  if (!isPgEnabled()) persistFile()
  return { ...toPublic(k), secret }
}

/** Revoke a key the user owns. Returns false if not found / not theirs. */
export async function revokeKey(userId: string, id: string): Promise<boolean> {
  const k = keys.find((x) => x.id === id)
  if (!k || k.userId !== userId) return false
  keys = keys.filter((x) => x.id !== id)
  if (isPgEnabled()) await keyRepo.delete(id)
  else persistFile()
  return true
}

const eq = (a: string, b: string): boolean => {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Match a raw bearer token (constant-time); returns the public key record on a hit.
 *  Stays synchronous — `lastUsedAt` is updated write-behind. */
export function verifyKey(raw: string | undefined): ApiKey | null {
  if (!raw) return null
  const incomingHash = sha256(raw)
  for (const k of keys) {
    const hit = k.hash ? eq(k.hash, incomingHash) : k.secret ? eq(k.secret, raw) : false
    if (hit) {
      const at = new Date().toISOString()
      k.lastUsedAt = at
      if (isPgEnabled()) keyRepo.touch(k.id, at).catch((e) => console.error('key touch failed:', e))
      else persistFile()
      return toPublic(k)
    }
  }
  return null
}

/** Drop every key for an org. In Pg mode the FK cascade already removed the rows;
 *  this keeps the RAM cache in sync (used when an org is deleted). */
export function revokeOrgKeys(orgId: string) {
  const before = keys.length
  keys = keys.filter((k) => k.orgId !== orgId)
  if (keys.length !== before && !isPgEnabled()) persistFile()
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
