// Relative imports only (no `@` alias) so this module runs unchanged under both
// Vite and tsx — it is imported by the server's MCP layer as well as the client.
import type { SwimNode, SwimEdge, SwimLane } from '../store/types'

export interface SwimPos {
  id: string
  x: number
  y: number
}

const START_X = 220 // first column clears the lane title block (LaneBackground: 16px inset + 152px label)
const COL_W = 220 // horizontal pitch between flow columns
const NODE_H: Record<string, number> = { start: 46, end: 46, decision: 66, process: 58 } // per-kind heights for lane centering (mirrors the UI's NODE_SIZE)

/**
 * Auto-arrange swimlane nodes into a readable left→right flow grid.
 *
 * Column = the node's depth in the dependency DAG (longest path from a source),
 * so every arrow points rightward and edges stop crossing back on themselves.
 * Within a lane each node also claims its own column, so two steps in the same
 * lane never stack on top of each other. Rows are fixed per lane (vertical band
 * center), which is what makes it read as a swimlane rather than a free graph.
 *
 * Nodes keep their lane; only x (and the lane-centered y) are reassigned. Nodes
 * whose lane no longer exists are left untouched.
 *
 * `avoid` = nodes that stay in place on the same canvas (a flow-scoped arrange
 * leaves the other flows' steps where they are). The arranged block starts to
 * the right of all of them, so repeated per-flow arranges never stack flows on
 * top of each other in the all-flows view.
 */
export function autoArrangeSwimlane(nodes: SwimNode[], edges: SwimEdge[], lanes: SwimLane[], avoid: SwimNode[] = []): SwimPos[] {
  const laneById = new Map(lanes.map((l) => [l.id, l]))
  const placeable = nodes.filter((n) => laneById.has(n.lane))
  let startX = START_X
  avoid.forEach((n) => { startX = Math.max(startX, n.x + COL_W) })
  const ids = new Set(placeable.map((n) => n.id))

  // Adjacency + indegree over present nodes only (ignore dangling edges).
  const preds = new Map<string, string[]>()
  const succs = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  placeable.forEach((n) => {
    preds.set(n.id, [])
    succs.set(n.id, [])
    indeg.set(n.id, 0)
  })
  edges.forEach((e) => {
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) return
    succs.get(e.from)!.push(e.to)
    preds.get(e.to)!.push(e.from)
    indeg.set(e.to, indeg.get(e.to)! + 1)
  })

  // Kahn topological order; leftover (cycle) nodes appended in original order.
  const order: string[] = []
  const queue = placeable.filter((n) => indeg.get(n.id) === 0).map((n) => n.id)
  const deg = new Map(indeg)
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    succs.get(id)!.forEach((s) => {
      deg.set(s, deg.get(s)! - 1)
      if (deg.get(s) === 0) queue.push(s)
    })
  }
  if (order.length < placeable.length) {
    const seen = new Set(order)
    placeable.forEach((n) => { if (!seen.has(n.id)) order.push(n.id) })
  }

  // Assign a column to each node: right of every predecessor, and unique within
  // its lane so same-lane steps spread across columns instead of overlapping.
  const col = new Map<string, number>()
  const laneCursor = new Map<number, number>()
  const laneOf = new Map(placeable.map((n) => [n.id, n.lane]))
  order.forEach((id) => {
    let base = 0
    preds.get(id)!.forEach((p) => {
      const pc = col.get(p)
      if (pc !== undefined) base = Math.max(base, pc + 1)
    })
    const lane = laneOf.get(id)!
    const c = Math.max(base, laneCursor.get(lane) ?? 0)
    col.set(id, c)
    laneCursor.set(lane, c + 1)
  })

  return placeable.map((n) => {
    const lane = laneById.get(n.lane)!
    const h = NODE_H[n.kind] ?? 58
    return {
      id: n.id,
      x: startX + (col.get(n.id) ?? 0) * COL_W,
      y: Math.round(lane.y + (lane.h - h) / 2),
    }
  })
}

/**
 * Arrange the WHOLE board so distinct flows never overlap. Each flow (nodes sharing
 * a `flowId`) is arranged into its own left→right band, tiled to the right of every
 * previously-placed flow via `autoArrangeSwimlane`'s `avoid` mechanism. Flow order
 * is first-appearance in `nodes` (deterministic — no clock/random). Legacy unscoped
 * steps (no flowId) are grouped last under their own band.
 *
 * This is what `arrange_swimlane` runs when called without a flowId, and what the
 * web UI's "Auto-arrange" runs in the All-flows view — so the all-flows canvas reads
 * as separate bands instead of two graphs stacked on the same origin.
 */
export function arrangeAllFlows(nodes: SwimNode[], edges: SwimEdge[], lanes: SwimLane[]): SwimPos[] {
  const order: string[] = []
  const groups = new Map<string, SwimNode[]>()
  nodes.forEach((n) => {
    const key = n.flowId ?? ''
    if (!groups.has(key)) { groups.set(key, []); order.push(key) }
    groups.get(key)!.push(n)
  })

  const placed: SwimNode[] = [] // previously-banded nodes, at their new positions, used as `avoid`
  const result: SwimPos[] = []
  order.forEach((key) => {
    const group = groups.get(key)!
    const pos = autoArrangeSwimlane(group, edges, lanes, placed)
    result.push(...pos)
    const posById = new Map(pos.map((p) => [p.id, p]))
    group.forEach((n) => {
      const p = posById.get(n.id)
      if (p) placed.push({ ...n, x: p.x, y: p.y })
    })
  })
  return result
}
