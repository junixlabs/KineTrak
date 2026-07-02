// The "Description Contract" budget — a soft, derived guardrail that keeps
// feature/step descriptions tight (see docs/AGENT_PLAYBOOK.md §1.6). The desc is
// the CURRENT contract; dated history/decisions go below a `— log —` marker. This
// helper measures the contract portion and the log separately, so moving history
// below the marker (per the convention) is what actually reduces the budget — the
// metric rewards the right behavior instead of just penalizing total length.
//
// Nothing is truncated: over-budget nodes are only *flagged* (validate_board +
// Overview) so an agent sees the noise and compacts it. Pure + shared by client
// and server so the threshold never drifts.

export const LOG_MARKER = '— log —'
export const DESC_MAX_CHARS = 700
export const DESC_MAX_LINES = 12
export const LOG_MAX_LINES = 5

export interface DescStats {
  /** Chars in the contract portion (above the log marker). */
  chars: number
  /** Non-empty lines in the contract portion. */
  lines: number
  /** Non-empty lines in the log portion (below the marker). */
  logLines: number
  overBudget: boolean
  /** Human-readable reasons it is over budget (empty when within budget). */
  reasons: string[]
}

export function descStats(text?: string): DescStats {
  const t = (text ?? '').trim()
  const idx = t.indexOf(LOG_MARKER)
  const contract = (idx === -1 ? t : t.slice(0, idx)).trim()
  const log = idx === -1 ? '' : t.slice(idx + LOG_MARKER.length).trim()
  const chars = contract.length
  const lines = contract ? contract.split('\n').filter((l) => l.trim()).length : 0
  const logLines = log ? log.split('\n').filter((l) => l.trim()).length : 0
  const reasons: string[] = []
  if (chars > DESC_MAX_CHARS) reasons.push(`contract is ${chars} chars (budget ${DESC_MAX_CHARS}) — rewrite tighter`)
  if (lines > DESC_MAX_LINES) reasons.push(`contract is ${lines} lines (budget ${DESC_MAX_LINES}) — split or trim`)
  if (logLines > LOG_MAX_LINES) reasons.push(`log has ${logLines} entries (keep ${LOG_MAX_LINES}) — compact older ones`)
  return { chars, lines, logLines, overBudget: reasons.length > 0, reasons }
}

export const isDescOverBudget = (text?: string): boolean => descStats(text).overBudget

/** The Meta/Project Context node is a steering doc (domain/stack/conventions),
 *  not a feature contract — it legitimately holds more than the feature budget,
 *  so it is exempt from the char/line budget (its log is still kept tight by the
 *  session-close routine). */
export function isSteeringDoc(featureName?: string, moduleName?: string): boolean {
  return (featureName ?? '').trim().toLowerCase() === 'project context' && (moduleName ?? '').trim().toLowerCase() === 'meta'
}

/** Whether a feature is the board's steering doc. A board that pins it via
 *  settings.contextFeatureId is authoritative (one steering doc per board, and
 *  the name match is off); un-migrated boards fall back to the legacy
 *  Meta/Project Context name match. */
export function isSteeringFeature(
  feature: { id: string; name?: string },
  moduleName: string | undefined,
  contextFeatureId?: string,
): boolean {
  if (contextFeatureId) return feature.id === contextFeatureId
  return isSteeringDoc(feature.name, moduleName)
}
