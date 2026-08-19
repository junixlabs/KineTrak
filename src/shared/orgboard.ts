// Pure structural checks for one org board (system map) — the org-level
// counterpart of flowStatusIssues. Shared by the client and the MCP
// validate_org_board tool so the rules never drift apart.
//
// The caller resolves all data: the server never holds a full Root (project
// boards load on demand), so instead of a Root this takes a feature lookup
// that may return undefined for projects the caller chose not to load —
// anchor checks are skipped for those, never guessed.
import type { Feature, OrgBoard } from './types'

export interface OrgBoardIssue {
  severity: 'error' | 'warning'
  kind: string
  message: string
  ids?: string[]
}

export interface OrgBoardIssueCtx {
  /** Ids of projects that still exist (catalog headers — cheap, no board load). */
  knownProjectIds: Set<string>
  /** Features of a project, or undefined when that board isn't loaded/known. */
  featureLookup: (projectId: string) => Feature[] | undefined
  /** Names of the org's other boards (for duplicate-name detection). */
  siblingNames?: string[]
}

export function orgBoardIssues(board: OrgBoard, ctx: OrgBoardIssueCtx): OrgBoardIssue[] {
  const issues: OrgBoardIssue[] = []
  const nodeById = new Map(board.nodes.map((n) => [n.id, n]))

  board.nodes.forEach((n) => {
    if (n.projectId && !ctx.knownProjectIds.has(n.projectId))
      issues.push({ severity: 'error', kind: 'dangling_project', message: `System “${n.label}” points at a project that no longer exists`, ids: [n.id] })
    if (!n.label.trim())
      issues.push({ severity: 'warning', kind: 'unnamed_system', message: 'A system has no label', ids: [n.id] })
    const connected = board.edges.some((e) => e.from === n.id || e.to === n.id)
    if (!connected && board.nodes.length > 1)
      issues.push({ severity: 'warning', kind: 'isolated_system', message: `System “${n.label}” has no integrations`, ids: [n.id] })
  })

  const checkAnchor = (edge: { from: string; to: string }, nodeId: string, featureId: string | undefined, side: 'provider' | 'consumer') => {
    if (!featureId) return
    const node = nodeById.get(nodeId)
    const label = `${nodeById.get(edge.from)?.label ?? '?'} → ${nodeById.get(edge.to)?.label ?? '?'}`
    if (!node?.projectId) {
      issues.push({ severity: 'error', kind: 'anchor_without_project', message: `Integration “${label}” anchors its ${side} end to a feature, but that system is not a project`, ids: [edge.from, edge.to] })
      return
    }
    const features = ctx.featureLookup(node.projectId)
    if (features && !features.some((f) => f.id === featureId))
      issues.push({ severity: 'error', kind: 'dangling_anchor', message: `Integration “${label}” anchors its ${side} end to a feature that no longer exists`, ids: [edge.from, edge.to, featureId] })
  }

  board.edges.forEach((e) => {
    const label = `${nodeById.get(e.from)?.label ?? '?'} → ${nodeById.get(e.to)?.label ?? '?'}`
    if (!nodeById.has(e.from) || !nodeById.has(e.to))
      issues.push({ severity: 'error', kind: 'dangling_edge', message: 'An integration references a missing system', ids: [e.from, e.to] })
    if (!e.desc?.trim())
      issues.push({ severity: 'warning', kind: 'empty_contract', message: `Integration “${label}” has no contract (desc)`, ids: [e.from, e.to] })
    if (e.codeStale)
      issues.push({ severity: 'warning', kind: 'stale_contract', message: `Integration “${label}” — linked code changed after the contract was last updated (reconcile, then resolve)`, ids: [e.from, e.to] })
    checkAnchor(e, e.from, e.fromFeatureId, 'provider')
    checkAnchor(e, e.to, e.toFeatureId, 'consumer')
  })

  if (ctx.siblingNames?.some((n) => n.trim().toLowerCase() === board.name.trim().toLowerCase()))
    issues.push({ severity: 'warning', kind: 'duplicate_board_name', message: `Another board in this org is also named “${board.name}”`, ids: [board.id] })

  return issues
}
