import { randomBytes } from 'node:crypto'
import { orgBoardShareRepo } from './infra/repositories'

// ── Public read-only org-board (system map) links ────────────────────────────
// Twin of shares.ts, keyed by org board instead of project: a token grants
// anonymous, read-only access to one system map. One active token per board;
// in-RAM cache warmed at boot, writes go to Postgres.

export interface OrgBoardShare {
  token: string
  orgBoardId: string
  createdAt: string
}

let shares: OrgBoardShare[] = []

/** Warm the in-RAM cache from Postgres. Called once at boot. */
export async function hydrateOrgBoardShares(): Promise<void> {
  shares = await orgBoardShareRepo.all()
}

export function shareForOrgBoard(orgBoardId: string): OrgBoardShare | undefined {
  return shares.find((s) => s.orgBoardId === orgBoardId)
}

/** Find-or-create a stable token for an org board. */
export async function createOrgBoardShare(orgBoardId: string): Promise<OrgBoardShare> {
  const existing = shareForOrgBoard(orgBoardId)
  if (existing) return existing
  const share: OrgBoardShare = { token: `ktm_${randomBytes(18).toString('hex')}`, orgBoardId, createdAt: new Date().toISOString() }
  shares.push(share)
  await orgBoardShareRepo.insert(share)
  return share
}

export async function revokeOrgBoardShare(orgBoardId: string): Promise<boolean> {
  const before = shares.length
  shares = shares.filter((s) => s.orgBoardId !== orgBoardId)
  if (shares.length === before) return false
  await orgBoardShareRepo.deleteByBoard(orgBoardId)
  return true
}

export function orgBoardIdForToken(token: string | undefined): string | undefined {
  if (!token) return undefined
  return shares.find((s) => s.token === token)?.orgBoardId
}

/** Drop shares for deleted boards from the RAM cache (FK cascade already
 *  removed the rows in Postgres). */
export function pruneOrgBoardShares(liveBoardIds: Set<string>) {
  shares = shares.filter((s) => liveBoardIds.has(s.orgBoardId))
}
