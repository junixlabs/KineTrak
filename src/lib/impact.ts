import type { Alert, AlertKind, OrgBoard, Project, SwimEdge, WorkspaceData } from '../shared/types'

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
  /** Other features touched: linked (via crossLinks) to a reached step, OR transitively depending on the focus feature. */
  affectedFeatures: string[]
  /** Modules that own at least one affected feature. */
  affectedModules: string[]
}

/** Features that transitively depend on `featureId` (its dependents) — changing the
 *  feature ripples up to everything that declared a dependsOn edge onto it. */
export function dependentsOf(data: WorkspaceData, featureId: string): Set<string> {
  const rev: Record<string, string[]> = {}
  for (const f of data.features) for (const dep of f.dependsOn ?? []) (rev[dep] = rev[dep] || []).push(f.id)
  const set = new Set<string>()
  const stack = [featureId]
  while (stack.length) {
    const x = stack.pop()!
    for (const y of rev[x] || []) if (!set.has(y)) { set.add(y); stack.push(y) }
  }
  return set
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

  const viaLinks = data.features
    .filter((f) => f.id !== focusId && (f.crossLinks ?? []).some((l) => l.view === 'swimlane' && l.targetId && reached.has(l.targetId)))
    .map((f) => f.id)
  // If the focus is itself a feature, everything that depends on it is impacted too.
  const isFeature = data.features.some((f) => f.id === focusId)
  const viaDeps = isFeature ? [...dependentsOf(data, focusId)] : []
  const affectedFeatures = [...new Set([...viaLinks, ...viaDeps])].filter((id) => id !== focusId).sort()

  const moduleOf = new Map(data.features.map((f) => [f.id, f.moduleId]))
  const affectedModules = [...new Set(affectedFeatures.map((id) => moduleOf.get(id)).filter((m): m is string => !!m))].sort()

  return { focus: focusId, entryNodes, downstream, affectedLanes, affectedFeatures, affectedModules }
}

/** What changing a feature touches, grouped by how directly — the answer a person reads in the
 *  feature panel. Built on computeImpact, so it says exactly what an agent's compute_impact says. */
export interface ImpactAnswer {
  impact: ImpactResult
  /** Features that declared a dependency on this one. */
  direct: string[]
  /** Features that depend on it through another feature. */
  indirect: string[]
  /** Features reached only through the workflow (linked to a step downstream of this one). */
  viaWorkflow: string[]
  /** Downstream steps in the order a person reads the flow (left to right). */
  steps: string[]
  /** One sentence with the counts; always contains "touch", including when nothing is touched. */
  sentence: string
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

export function impactAnswer(data: WorkspaceData, featureId: string): ImpactAnswer {
  const impact = computeImpact(data, featureId)
  const direct = data.features.filter((f) => (f.dependsOn ?? []).includes(featureId) && f.id !== featureId).map((f) => f.id)
  const all = dependentsOf(data, featureId)
  all.delete(featureId)
  const indirect = [...all].filter((id) => !direct.includes(id))
  const viaWorkflow = impact.affectedFeatures.filter((id) => !all.has(id))
  const pos = new Map(data.swimNodes.map((n) => [n.id, n.x]))
  const steps = [...impact.downstream].sort((a, b) => (pos.get(a) ?? 0) - (pos.get(b) ?? 0) || a.localeCompare(b))
  const features = impact.affectedFeatures.length
  const parts = [
    features ? count(features, 'feature') : '',
    steps.length ? count(steps.length, 'workflow step') : '',
    impact.affectedLanes.length ? count(impact.affectedLanes.length, 'lane') : '',
  ].filter(Boolean)
  const sentence = parts.length
    ? `Changing it touches ${list(parts)}.`
    : `Changing it touches nothing else on this board: no feature depends on it${impact.entryNodes.length ? ' and nothing follows its step in the workflow' : ' and it is not linked into the workflow'}.`
  return { impact, direct, indirect, viaWorkflow, steps, sentence }
}

/** The features `featureId` may be declared to depend on: not itself, not one it already depends on,
 *  and not one that already depends on it (directly or not) — that would make a cycle. */
export function dependencyCandidates(data: WorkspaceData, featureId: string): string[] {
  const f = data.features.find((x) => x.id === featureId)
  if (!f) return []
  const have = new Set(f.dependsOn ?? [])
  const above = dependentsOf(data, featureId)
  return data.features.filter((x) => x.id !== featureId && !have.has(x.id) && !above.has(x.id)).map((x) => x.id)
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
    // Qualify on the swimlane footprint (as before) OR on declared cross-feature
    // dependents (the new dependsOn axis — not the crossLink-reachable features,
    // which are already part of the same swimlane footprint).
    const swimQualifies = !!imp.entryNodes.length && imp.downstream.length >= threshold
    const hasDependents = dependentsOf(data, f.id).size > 0
    if (!swimQualifies && !hasDependents) continue
    const steps = imp.downstream.length
    const lanes = imp.affectedLanes.length
    const feats = imp.affectedFeatures.length
    const swimPart = imp.entryNodes.length ? `${steps} downstream step${steps === 1 ? '' : 's'} across ${lanes} lane${lanes === 1 ? '' : 's'}` : ''
    const featPart = feats ? `${feats} other feature${feats === 1 ? '' : 's'}` : ''
    const detail = `Changing "${f.name}" affects ${[swimPart, featPart].filter(Boolean).join(' and ')}.`
    const selection = imp.entryNodes.length
      ? { type: 'swimnode' as const, id: imp.entryNodes[0], view: 'swimlane' as const }
      : { type: 'feature' as const, id: f.id, view: 'mindmap' as const }
    alerts.push({
      id: `impact:${f.id}`,
      kind: 'impact',
      title: `Impact: ${f.name}`,
      detail,
      tags: ['@BA', '@Dev'],
      time: 'live',
      actionLabel: 'View impact zone',
      action: { view: imp.entryNodes.length ? 'swimlane' : 'mindmap', selection },
    })
  }
  return alerts.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Live "outdated" alerts DERIVED from the board: any feature/step a VCS webhook
 * flagged `codeStale` (its linked code changed after the node was last updated).
 * Replaces the old seeded mock alert — deterministic, cleared when the node is
 * re-linked/reviewed. Pure.
 */
export function deriveOutdatedAlerts(data: WorkspaceData): Alert[] {
  const alerts: Alert[] = []
  for (const f of data.features)
    if (f.codeStale)
      alerts.push({
        id: `outdated:${f.id}`,
        kind: 'outdated',
        title: `Outdated: ${f.name}`,
        detail: `Linked code changed after "${f.name}" was last updated. Re-check the spec against the code, then resolve.`,
        tags: ['@Dev', '@BA'],
        time: 'live',
        actionLabel: 'Open feature',
        action: { view: 'mindmap', selection: { type: 'feature', id: f.id, view: 'mindmap' } },
      })
  for (const n of data.swimNodes)
    if (n.codeStale)
      alerts.push({
        id: `outdated:${n.id}`,
        kind: 'outdated',
        title: `Outdated: ${n.label}`,
        detail: `Linked code changed after step "${n.label}" was last updated. Re-check the flow against the code, then resolve.`,
        tags: ['@Dev'],
        time: 'live',
        actionLabel: 'Open step',
        action: { view: 'swimlane', selection: { type: 'swimnode', id: n.id, view: 'swimlane' } },
      })
  return alerts.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Live "definition of done" alerts DERIVED from the board: any committed feature
 * (must/progress) that has acceptance criteria with at least one unmet item. Ties
 * the DoD warning to the structured acceptance-criteria checklist. Pure.
 */
export function deriveDodAlerts(data: WorkspaceData): Alert[] {
  const alerts: Alert[] = []
  for (const f of data.features) {
    if (f.status !== 'must' && f.status !== 'progress') continue
    const total = f.validations?.length ?? 0
    if (!total) continue
    const done = (f.validationsDone ?? []).filter((t) => f.validations!.includes(t)).length
    if (done >= total) continue
    alerts.push({
      id: `dod:${f.id}`,
      kind: 'dod',
      title: `Definition of Done: ${f.name}`,
      detail: `${total - done} of ${total} acceptance criteria unmet — cannot ship "${f.name}" until they are checked off.`,
      tags: ['@Tester', '@BA'],
      time: 'live',
      actionLabel: 'Open feature',
      action: { view: 'mindmap', selection: { type: 'feature', id: f.id, view: 'mindmap' } },
    })
  }
  return alerts.sort((a, b) => a.id.localeCompare(b.id))
}

/** Org context for cross-project alerts — the caller's scoped root, narrowed. */
export interface OrgAlertCtx {
  orgBoards: OrgBoard[]
  projects: Pick<Project, 'id' | 'name' | 'data'>[]
  /** The project whose board is being viewed (alerts are for its audience). */
  projectId: string
}

/**
 * Cross-project alerts DERIVED from org boards (alert-only by design — they never
 * gate shipping). Two sources, both anchored on integration edges:
 * - impact: a provider feature this project consumes is being changed (must/progress)
 * - outdated: an integration contract touching this project is flagged codeStale
 * Ids are board-qualified (`org-impact:<boardId>:<from>:<to>`) so they can never
 * collide with the single-project `impact:<featureId>` ids. Pure, deterministic.
 */
export function deriveOrgImpactAlerts(ctx: OrgAlertCtx): Alert[] {
  const alerts: Alert[] = []
  const projById = new Map(ctx.projects.map((p) => [p.id, p]))
  for (const board of ctx.orgBoards) {
    const nodeById = new Map(board.nodes.map((n) => [n.id, n]))
    for (const e of board.edges) {
      const fromNode = nodeById.get(e.from)
      const toNode = nodeById.get(e.to)
      if (!fromNode || !toNode) continue
      const touchesProject = fromNode.projectId === ctx.projectId || toNode.projectId === ctx.projectId
      const edgeName = e.label || `${fromNode.label} → ${toNode.label}`

      // Consumer side: the provider feature behind an integration we consume is changing.
      if (toNode.projectId === ctx.projectId && e.fromFeatureId && fromNode.projectId) {
        const provider = projById.get(fromNode.projectId)
        const feat = provider?.data.features.find((f) => f.id === e.fromFeatureId)
        if (feat && (feat.status === 'must' || feat.status === 'progress'))
          alerts.push({
            id: `org-impact:${board.id}:${e.from}:${e.to}`,
            kind: 'impact',
            title: `Provider changing: ${edgeName}`,
            detail: `“${feat.name}” in ${provider!.name} — the provider side of “${edgeName}” — is being changed. Re-check the contract before relying on it.`,
            tags: ['@BA', '@Dev'],
            time: 'live',
            actionLabel: 'Open org board',
            action: { view: 'orgboard', boardId: board.id, edge: { from: e.from, to: e.to } },
          })
      }

      // Either side: the integration's linked code drifted from its contract.
      if (touchesProject && e.codeStale)
        alerts.push({
          id: `org-outdated:${board.id}:${e.from}:${e.to}`,
          kind: 'outdated',
          title: `Contract outdated: ${edgeName}`,
          detail: `Code implementing “${edgeName}” changed after the contract was last updated (org board “${board.name}”). Reconcile the contract, then resolve.`,
          tags: ['@Dev', '@BA'],
          time: 'live',
          actionLabel: 'Open org board',
          action: { view: 'orgboard', boardId: board.id, edge: { from: e.from, to: e.to } },
        })
    }
  }
  return alerts.sort((a, b) => a.id.localeCompare(b.id))
}

/** Kinds recomputed from the board on every read, so they are never taken from data.alerts. */
const DERIVED_ALERT_KINDS: ReadonlySet<AlertKind> = new Set<AlertKind>(['impact', 'outdated', 'dod'])

// cm:guard widening this beyond 'friction' hands the UI an undoable DELETE: a 'question' is a
// decision its agent is still polling on, a derived kind returns next read. Add an answer path first.
export function isDismissibleAlertKind(kind: AlertKind): boolean {
  return kind === 'friction'
}

// cm:guard a friction report normally carries no nodeId, so its AlertAction points at an EMPTY
// swimlane; render no navigation control when this is false or a click meant to read ejects the user.
export function hasAlertTarget(a: Alert): boolean {
  return a.action.view === 'orgboard' || a.action.selection !== null || a.kind !== 'friction'
}

/** All live, derived alerts for a board (impact + outdated + DoD + cross-project
 *  org alerts when org context is provided), plus the board's own stored
 *  non-derived alerts ('question' decisions and 'friction' tooling reports). */
export function deriveAllAlerts(data: WorkspaceData, threshold = DEFAULT_IMPACT_THRESHOLD, org?: OrgAlertCtx): Alert[] {
  return [
    ...deriveImpactAlerts(data, threshold),
    ...deriveOutdatedAlerts(data),
    ...deriveDodAlerts(data),
    ...(org ? deriveOrgImpactAlerts(org) : []),
    ...data.alerts.filter((a) => !DERIVED_ALERT_KINDS.has(a.kind)),
  ]
}
