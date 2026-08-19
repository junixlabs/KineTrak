// Relative imports only (no `@` alias) so this module runs unchanged under both
// Vite and tsx — it is the single source of truth for board-quality invariants,
// imported by the server's MCP layer (validate_board, create_snapshot, next_action)
// and the client, and exercised directly by tests.
import type { WorkspaceData, BoardRole } from './types'
import { isSteeringFeature } from '../lib/descriptions'

export type QualitySeverity = 'error' | 'warning'

/**
 * The flow/layout/definition-of-done family of board-quality problems. Structural
 * corruption (orphan features, bad lanes, dangling edges/flows, bloated docs, status
 * drift) is still owned by validate_board / flowstatus / descriptions — this module
 * owns the invariants that let a board become an unreadable tangle or ship unverified.
 */
export type QualityKind =
  | 'unscoped_step' // I1 — every swim node must belong to a flow (feature)
  | 'overlapping_steps' // I2 — no two nodes stacked at the same spot in a lane
  | 'cross_flow_edge' // I4 — an edge that jumps between two flows
  | 'decision_no_branches' // I5 — a decision node that doesn't fork
  | 'flow_no_start' // I6 — a flow with no start node
  | 'flow_no_end' // I6 — a flow with no end node
  | 'done_without_acceptance' // I7 — a done feature with no / unmet acceptance criteria

export interface QualityIssue {
  severity: QualitySeverity
  kind: QualityKind
  message: string
  ids: string[]
}

/** Overlap threshold in px: nodes closer than this on BOTH axes read as stacked. */
export const OVERLAP_PX = 40

// On an ssot board these invariants are hard errors (block ok + create_snapshot);
// on a map / asis-doc board the truth lives elsewhere, so they stay advisory.
const ERROR_ON_SSOT = new Set<QualityKind>([
  'unscoped_step',
  'overlapping_steps',
  'cross_flow_edge',
  'decision_no_branches',
  'flow_no_start',
  'flow_no_end',
])

/** Resolve an invariant's severity for a given board contract. */
export function severityFor(kind: QualityKind, role: BoardRole | undefined): QualitySeverity {
  return role === 'ssot' && ERROR_ON_SSOT.has(kind) ? 'error' : 'warning'
}

/**
 * Run every board-quality invariant, returning issues with severity already resolved
 * against the board's role. Callers (validate_board, create_snapshot, next_action)
 * just consume the list — the policy lives here, once.
 */
export function boardQualityIssues(data: WorkspaceData): QualityIssue[] {
  const role = data.settings?.boardRole
  const issues: QualityIssue[] = []
  const push = (kind: QualityKind, message: string, ids: string[]) =>
    issues.push({ severity: severityFor(kind, role), kind, message, ids })

  const nodes = data.swimNodes
  const featById = new Map(data.features.map((f) => [f.id, f]))

  // I1 — unscoped step (no flowId at all). A flowId pointing at a MISSING feature is
  // dangling_flow, owned by validate_board; here we only catch the total absence.
  nodes.forEach((n) => {
    if (!n.flowId)
      push('unscoped_step', `Step “${n.label}” has no flowId — it renders in every flow view and overlaps scoped flows. Scope it to its feature.`, [n.id])
  })

  // I2 — overlapping steps: same lane, within OVERLAP_PX on both axes. Report each pair once.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      if (a.lane === b.lane && Math.abs(a.x - b.x) < OVERLAP_PX && Math.abs(a.y - b.y) < OVERLAP_PX)
        push('overlapping_steps', `Steps “${a.label}” and “${b.label}” overlap (same lane, ~same position) — run arrange_swimlane to band the flows apart.`, [a.id, b.id])
    }
  }

  // I4 — cross-flow edge: an arrow between two different scoped flows.
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  data.swimEdges.forEach((e) => {
    const a = nodeById.get(e.from)
    const b = nodeById.get(e.to)
    if (a?.flowId && b?.flowId && a.flowId !== b.flowId)
      push('cross_flow_edge', `Edge “${a.label}” → “${b.label}” crosses two flows — steps of one flow should connect within it.`, [e.from, e.to])
  })

  // I5 — a decision node must fork (≥2 outgoing edges).
  const outCount = new Map<string, number>()
  data.swimEdges.forEach((e) => outCount.set(e.from, (outCount.get(e.from) ?? 0) + 1))
  nodes.forEach((n) => {
    if (n.kind === 'decision' && (outCount.get(n.id) ?? 0) < 2)
      push('decision_no_branches', `Decision “${n.label}” has fewer than 2 outgoing branches — a decision should fork (add branch edges with labels).`, [n.id])
  })

  // I6 — each scoped flow (feature exists) needs a start and an end node.
  const kindsByFlow = new Map<string, Set<string>>()
  nodes.forEach((n) => {
    if (!n.flowId) return
    const set = kindsByFlow.get(n.flowId) ?? new Set<string>()
    set.add(n.kind)
    kindsByFlow.set(n.flowId, set)
  })
  kindsByFlow.forEach((kinds, flowId) => {
    const f = featById.get(flowId)
    if (!f) return // dangling_flow is reported by validate_board
    if (!kinds.has('start')) push('flow_no_start', `Flow “${f.name}” has no start node — mark its entry step kind: start.`, [f.id])
    if (!kinds.has('end')) push('flow_no_end', `Flow “${f.name}” has no end node — mark its terminal step kind: end.`, [f.id])
  })

  // I7 — definition of done. Only meaningful where the board IS the truth (ssot):
  // on map / asis-doc, "done" means "exists elsewhere", not "acceptance met". The
  // steering / Project Context feature is a meta doc, not shippable work — exempt it
  // (same as the description-budget check).
  if (role === 'ssot') {
    const moduleName = new Map(data.modules.map((m) => [m.id, m.name]))
    const ctxId = data.settings?.contextFeatureId
    data.features.forEach((f) => {
      if (f.status !== 'done') return
      if (isSteeringFeature(f, moduleName.get(f.moduleId), ctxId)) return
      const total = f.validations?.length ?? 0
      const done = f.validationsDone?.length ?? 0
      if (total === 0)
        push('done_without_acceptance', `Feature “${f.name}” is done but has no acceptance criteria — add them (set_acceptance) and tick each verified.`, [f.id])
      else if (done < total)
        push('done_without_acceptance', `Feature “${f.name}” is done but ${total - done}/${total} acceptance criteria are unchecked — verify & check them, or reopen it.`, [f.id])
    })
  }

  return issues
}
