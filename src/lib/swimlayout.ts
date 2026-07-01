import type { SwimNode, SwimEdge, SwimLane } from '@/store/types'

export interface SwimPos {
  id: string
  x: number
  y: number
}

const START_X = 60
const COL_W = 220 // horizontal pitch between flow columns
const NODE_H = 58 // representative node height used for lane centering

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
 */
export function autoArrangeSwimlane(nodes: SwimNode[], edges: SwimEdge[], lanes: SwimLane[]): SwimPos[] {
  const laneById = new Map(lanes.map((l) => [l.id, l]))
  const placeable = nodes.filter((n) => laneById.has(n.lane))
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
    return {
      id: n.id,
      x: START_X + (col.get(n.id) ?? 0) * COL_W,
      y: Math.round(lane.y + (lane.h - NODE_H) / 2),
    }
  })
}
