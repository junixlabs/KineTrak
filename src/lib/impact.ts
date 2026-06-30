import type { Alert, SwimEdge, WorkspaceData } from '../store/types'

// Relative imports only (no `@` alias) so this module runs unchanged under both
// Vite and tsx — it is imported by the server's MCP layer as well as the client.

/**
 * Downstream reachability from a focus node, following edge direction.
 * Used for Swimlane impact highlighting: a node and everything it can reach.
 */
export function reachableFrom(focusId: string | null, edges: SwimEdge[]): Set<string> {
  const set = new Set<string>()
  if (!focusId) return set
  const adj: Record<string, string[]> = {}
  edges.forEach((e) => {
    ;(adj[e.from] = adj[e.from] || []).push(e.to)
  })
  const stack = [focusId]
  set.add(focusId)
  while (stack.length) {
    const x = stack.pop()!
    for (const y of adj[x] || []) {
      if (!set.has(y)) {
        set.add(y)
        stack.push(y)
      }
    }
  }
  return set
}

export interface ImpactResult {
  /** The feature or swim-node id the impact was computed from. */
  focus: string
  /** Swimlane node(s) where propagation enters the flow (the focus, or a feature's linked nodes). */
  entryNodes: string[]
  /** Affected steps strictly downstream of the entry node(s). */
  downstream: string[]
  /** Lane ids that contain at least one affected step. */
  affectedLanes: number[]
  /** Other features linked (via crossLinks) to any reached step. */
  affectedFeatures: string[]
}

/** Resolve the swimlane entry node(s) for a focus id (a swim-node id, or a feature
 *  whose crossLinks point into the swimlane). */
function entryNodesFor(data: WorkspaceData, focusId: string): string[] {
  if (data.swimNodes.some((n) => n.id === focusId)) return [focusId]
  const feat = data.features.find((f) => f.id === focusId)
  if (!feat) return []
  const nodeIds = new Set(data.swimNodes.map((n) => n.id))
  return (feat.crossLinks ?? [])
    .filter((l) => l.view === 'swimlane' && l.targetId && nodeIds.has(l.targetId))
    .map((l) => l.targetId as string)
}

/**
 * Cross-view impact of a feature/swim-node change: from its swimlane entry node(s),
 * everything reachable downstream, plus the lanes and other features touched. Pure.
 */
export function computeImpact(data: WorkspaceData, focusId: string): ImpactResult {
  const entryNodes = entryNodesFor(data, focusId)
  const reached = new Set<string>()
  for (const e of entryNodes) for (const id of reachableFrom(e, data.swimEdges)) reached.add(id)
  const entrySet = new Set(entryNodes)
  const downstream = [...reached].filter((id) => !entrySet.has(id)).sort()

  const laneOf = new Map(data.swimNodes.map((n) => [n.id, n.lane]))
  const affectedLanes = [...new Set(downstream.map((id) => laneOf.get(id)).filter((l): l is number => l !== undefined))].sort(
    (a, b) => a - b,
  )

  const affectedFeatures = data.features
    .filter((f) => f.id !== focusId && (f.crossLinks ?? []).some((l) => l.view === 'swimlane' && l.targetId && reached.has(l.targetId)))
    .map((f) => f.id)
    .sort()

  return { focus: focusId, entryNodes, downstream, affectedLanes, affectedFeatures }
}

export const DEFAULT_IMPACT_THRESHOLD = 3

/**
 * Live impact alerts, DERIVED from board state (not stored): any committed feature
 * (status must/progress) linked into the swimlane whose downstream footprint meets
 * the project threshold raises a standing alert. Deterministic — stable ids, no
 * clock/random — so it is safe to recompute on every render and on any client.
 */
export function deriveImpactAlerts(data: WorkspaceData, threshold = DEFAULT_IMPACT_THRESHOLD): Alert[] {
  const alerts: Alert[] = []
  for (const f of data.features) {
    if (f.status !== 'must' && f.status !== 'progress') continue
    const imp = computeImpact(data, f.id)
    if (!imp.entryNodes.length || imp.downstream.length < threshold) continue
    const steps = imp.downstream.length
    const lanes = imp.affectedLanes.length
    alerts.push({
      id: `impact:${f.id}`,
      kind: 'impact',
      title: `Impact: ${f.name}`,
      detail: `Changing "${f.name}" affects ${steps} downstream step${steps === 1 ? '' : 's'} across ${lanes} lane${lanes === 1 ? '' : 's'} in the Swimlane.`,
      tags: ['@BA', '@Dev'],
      time: 'live',
      actionLabel: 'View impact zone',
      action: { view: 'swimlane', selection: { type: 'swimnode', id: imp.entryNodes[0], view: 'swimlane' } },
    })
  }
  return alerts.sort((a, b) => a.id.localeCompare(b.id))
}
