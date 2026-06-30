import { randomBytes } from 'node:crypto'
import { shareRepo } from './infra/repositories'

// ── Public read-only share links ─────────────────────────────────────────────
// A share token maps to one project and grants anonymous, read-only access to
// that project's board (a "present" link). One active token per project. An
// in-RAM cache (warmed at boot) serves sync lookups; writes go to Postgres.

export interface Share {
  token: string
  projectId: string
  createdAt: string
}

let shares: Share[] = []

/** Warm the in-RAM cache from Postgres. Called once at boot. */
export async function hydrateShares(): Promise<void> {
  shares = await shareRepo.all()
}

export function shareForProject(projectId: string): Share | undefined {
  return shares.find((s) => s.projectId === projectId)
}

/** Find-or-create a stable token for a project. */
export async function createShare(projectId: string): Promise<Share> {
  const existing = shareForProject(projectId)
  if (existing) return existing
  const share: Share = { token: `kts_${randomBytes(18).toString('hex')}`, projectId, createdAt: new Date().toISOString() }
  shares.push(share)
  await shareRepo.insert(share)
  return share
}

export async function revokeShare(projectId: string): Promise<boolean> {
  const before = shares.length
  shares = shares.filter((s) => s.projectId !== projectId)
  if (shares.length === before) return false
  await shareRepo.deleteByProject(projectId)
  return true
}

export function projectIdForToken(token: string | undefined): string | undefined {
  if (!token) return undefined
  return shares.find((s) => s.token === token)?.projectId
}

/** Drop shares for deleted projects from the RAM cache (the FK cascade already
 *  removed the rows in Postgres). */
export function pruneShares(liveProjectIds: Set<string>) {
  shares = shares.filter((s) => liveProjectIds.has(s.projectId))
}
