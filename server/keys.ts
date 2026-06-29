import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

// ── API keys for MCP access ──────────────────────────────────────────────────
// Each key belongs to a user and is scoped to one org (workspace). An agent using
// the key acts as that user, limited to that org's projects. Stored server-side
// only (never in synced board state). Treat keys like passwords.

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const FILE = join(DATA_DIR, 'keys.json')

export interface ApiKey {
  id: string
  userId: string
  orgId: string
  name: string
  key: string
  createdAt: string
  lastUsedAt: string | null
}

let keys: ApiKey[] = load()

function load(): ApiKey[] {
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* ignore */
    }
  }
  return []
}
function persist() {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(keys, null, 2))
}
function newSecret(): string {
  return `kt_live_${randomBytes(24).toString('hex')}`
}

/** Keys owned by a user, optionally filtered to one org. */
export function listKeys(userId: string, orgId?: string): ApiKey[] {
  return keys.filter((k) => k.userId === userId && (!orgId || k.orgId === orgId)).map((k) => ({ ...k }))
}

export function createKey(userId: string, orgId: string, name?: string): ApiKey {
  const k: ApiKey = {
    id: randomUUID(),
    userId,
    orgId,
    name: (name?.trim() || 'Agent key').slice(0, 80),
    key: newSecret(),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }
  keys.unshift(k)
  persist()
  return k
}

/** Revoke a key the user owns. Returns false if not found / not theirs. */
export function revokeKey(userId: string, id: string): boolean {
  const k = keys.find((x) => x.id === id)
  if (!k || k.userId !== userId) return false
  keys = keys.filter((x) => x.id !== id)
  persist()
  return true
}

/** Constant-time match of a raw bearer token; returns the key record on a hit. */
export function verifyKey(raw: string | undefined): ApiKey | null {
  if (!raw) return null
  const candidate = Buffer.from(raw)
  for (const k of keys) {
    const known = Buffer.from(k.key)
    if (known.length === candidate.length && timingSafeEqual(known, candidate)) {
      k.lastUsedAt = new Date().toISOString()
      persist()
      return k
    }
  }
  return null
}

/** Drop every key for an org (used when an org is deleted). */
export function revokeOrgKeys(orgId: string) {
  const before = keys.length
  keys = keys.filter((k) => k.orgId !== orgId)
  if (keys.length !== before) persist()
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
