import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

// ── API keys for MCP access ──────────────────────────────────────────────────
// A lightweight, local-first key store. Keys gate the /mcp endpoint so only
// authorized agents can read/edit the board. Stored alongside board.json but in
// a separate file — keys are NEVER part of the synced Root broadcast to browsers.
//
// Enforcement model (backward compatible): the /mcp endpoint is open while no
// keys exist (zero-config dev). The moment one key exists — created via the
// Connect page or seeded from KINETRAK_API_KEY — a valid Bearer token is required.

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const FILE = join(DATA_DIR, 'keys.json')

export interface ApiKey {
  id: string
  name: string
  /** The full secret, e.g. "kt_live_ab12…". Shown in the Connect page (local tool). */
  key: string
  createdAt: string
  lastUsedAt: string | null
  /** Seeded from the KINETRAK_API_KEY env var — not user-deletable. */
  env?: boolean
}

let keys: ApiKey[] = load()

function load(): ApiKey[] {
  let stored: ApiKey[] = []
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
      if (Array.isArray(parsed)) stored = parsed.filter((k) => !k.env)
    } catch {
      /* fall through to empty */
    }
  }
  // Seed an env-provided key (e.g. for Docker deploys) so it always exists.
  const envKey = process.env.KINETRAK_API_KEY?.trim()
  if (envKey) {
    stored.unshift({
      id: 'env',
      name: 'Environment key (KINETRAK_API_KEY)',
      key: envKey,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      env: true,
    })
  }
  return stored
}

function persist() {
  mkdirSync(DATA_DIR, { recursive: true })
  // Never persist the env-seeded key — it comes from the environment each boot.
  writeFileSync(FILE, JSON.stringify(keys.filter((k) => !k.env), null, 2))
}

function newSecret(): string {
  return `kt_live_${randomBytes(24).toString('hex')}`
}

/** Auth is enforced only once at least one key exists. */
export function authEnabled(): boolean {
  return keys.length > 0
}

/** Public view of keys (Connect page reveals the secret — this is a local tool). */
export function listKeys(): ApiKey[] {
  return keys.map((k) => ({ ...k }))
}

export function createKey(name?: string): ApiKey {
  const k: ApiKey = {
    id: randomUUID(),
    name: (name?.trim() || 'Untitled key').slice(0, 80),
    key: newSecret(),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }
  keys.unshift(k)
  persist()
  return k
}

export function revokeKey(id: string): boolean {
  const k = keys.find((x) => x.id === id)
  if (!k || k.env) return false // env key is managed via the environment, not the API
  keys = keys.filter((x) => x.id !== id)
  persist()
  return true
}

/** Constant-time check of a raw bearer token; records last-used on a hit. */
export function verifyKey(raw: string | undefined): boolean {
  if (!raw) return false
  const candidate = Buffer.from(raw)
  for (const k of keys) {
    const known = Buffer.from(k.key)
    if (known.length === candidate.length && timingSafeEqual(known, candidate)) {
      k.lastUsedAt = new Date().toISOString()
      if (!k.env) persist()
      return true
    }
  }
  return false
}

/** Pull a bearer token from an Authorization header (also accepts X-API-Key). */
export function bearerFrom(headers: Record<string, unknown>): string | undefined {
  const auth = headers['authorization']
  if (typeof auth === 'string') {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (m) return m[1].trim()
  }
  const x = headers['x-api-key']
  return typeof x === 'string' ? x.trim() : undefined
}
