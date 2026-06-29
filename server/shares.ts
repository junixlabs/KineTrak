import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

// ── Public read-only share links ─────────────────────────────────────────────
// A share token maps to one project and grants anonymous, read-only access to
// that project's board (a "present" link). One active token per project.

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const FILE = join(DATA_DIR, 'shares.json')

export interface Share {
  token: string
  projectId: string
  createdAt: string
}

let shares: Share[] = load()

function load(): Share[] {
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
  writeFileSync(FILE, JSON.stringify(shares, null, 2))
}

export function shareForProject(projectId: string): Share | undefined {
  return shares.find((s) => s.projectId === projectId)
}

/** Find-or-create a stable token for a project. */
export function createShare(projectId: string): Share {
  const existing = shareForProject(projectId)
  if (existing) return existing
  const share: Share = { token: `kts_${randomBytes(18).toString('hex')}`, projectId, createdAt: new Date().toISOString() }
  shares.push(share)
  persist()
  return share
}

export function revokeShare(projectId: string): boolean {
  const before = shares.length
  shares = shares.filter((s) => s.projectId !== projectId)
  if (shares.length === before) return false
  persist()
  return true
}

export function projectIdForToken(token: string | undefined): string | undefined {
  if (!token) return undefined
  return shares.find((s) => s.token === token)?.projectId
}

/** Drop shares for deleted projects (housekeeping). */
export function pruneShares(liveProjectIds: Set<string>) {
  const before = shares.length
  shares = shares.filter((s) => liveProjectIds.has(s.projectId))
  if (shares.length !== before) persist()
}
