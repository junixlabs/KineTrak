import type { Alert, OrgBoard, Project, SwimEdge, WorkspaceData } from '../store/types'

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

/** All live, derived alerts for a board (impact + outdated + DoD + cross-project
 *  org alerts when org context is provided), plus the board's own stored
 *  non-derived alerts (e.g. pending human-decision 'question's). */
export function deriveAllAlerts(data: WorkspaceData, threshold = DEFAULT_IMPACT_THRESHOLD, org?: OrgAlertCtx): Alert[] {
  const derivedKinds = new Set(['impact', 'outdated', 'dod'])
  return [
    ...deriveImpactAlerts(data, threshold),
    ...deriveOutdatedAlerts(data),
    ...deriveDodAlerts(data),
    ...(org ? deriveOrgImpactAlerts(org) : []),
    ...data.alerts.filter((a) => !derivedKinds.has(a.kind)),
  ]
}
