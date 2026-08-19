// Relative imports only (no `@` alias) so this module runs unchanged under both
// Vite and tsx — it is imported by the server's MCP layer as well as the client.
import type { Feature, SwimNode } from '../shared/types'

export interface FlowStatusIssue {
  severity: 'warning'
  kind: 'flow_lags_feature' | 'feature_lags_flow'
  message: string
  ids: string[]
}

/**
 * Status drift between the Mindmap and the Swimlane: a feature and its scoped
 * flow (swim nodes with flowId = feature id) should tell the same story.
 * - feature done but flow steps not all done → the board reads as unfinished
 *   work when the code already shipped (or the feature was closed too early).
 * - all flow steps done but the feature isn't → validate & ship the feature,
 *   or the flow is missing steps.
 * Structural problems (dangling flowId) are validate_board's other rules.
 */
export function flowStatusIssues(features: Feature[], swimNodes: SwimNode[]): FlowStatusIssue[] {
  const tally = new Map<string, { total: number; done: number }>()
  swimNodes.forEach((n) => {
    if (!n.flowId) return
    const t = tally.get(n.flowId) ?? { total: 0, done: 0 }
    t.total += 1
    if (n.status === 'done') t.done += 1
    tally.set(n.flowId, t)
  })
  const issues: FlowStatusIssue[] = []
  const featById = new Map(features.map((f) => [f.id, f]))
  tally.forEach((t, flowId) => {
    const f = featById.get(flowId)
    if (!f) return // dangling_flow is reported elsewhere
    if (f.status === 'done' && t.done < t.total)
      issues.push({
        severity: 'warning',
        kind: 'flow_lags_feature',
        message: `Feature “${f.name}” is done but ${t.total - t.done}/${t.total} of its flow steps are not — flip them with evidence, or revisit the feature status`,
        ids: [f.id],
      })
    else if (f.status !== 'done' && t.done === t.total)
      issues.push({
        severity: 'warning',
        kind: 'feature_lags_flow',
        message: `All ${t.total} flow steps of “${f.name}” are done but the feature is “${f.status}” — validate & ship it, or add the missing steps`,
        ids: [f.id],
      })
  })
  return issues
}
