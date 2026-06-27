import type { SwimEdge } from '@/store/types'

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
