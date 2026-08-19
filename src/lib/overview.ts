import type { Alert, FeatureStatus, NodeStatus, WorkspaceData } from '../shared/types'
import { deriveAllAlerts, DEFAULT_IMPACT_THRESHOLD, type OrgAlertCtx } from './impact'
import { isDescOverBudget, isSteeringFeature } from './descriptions'

// A glanceable "state of the product" summary for the human — the read-only
// counterpart to the agent's next_action. PURE and fully DERIVED from board
// metadata + pointers: it reads no external code and stores nothing (honors the
// "board holds meaning + pointers, never code" principle). Just a lens on data
// the impact engine already computes.

export interface Gap {
  kind: 'feature' | 'swimnode'
  id: string
  label: string
}

export interface Overview {
  features: Record<FeatureStatus, number> & { total: number }
  steps: Record<NodeStatus, number> & { total: number }
  alerts: { impact: number; outdated: number; dod: number; question: number; friction: number; total: number; list: Alert[] }
  /** Semantic completeness of the board as a source of truth (not structural — that's validate_board). */
  fidelity: {
    /** Committed features (must/progress) with no code linked. */
    featuresWithoutCode: Gap[]
    /** Committed features with unmet acceptance criteria. */
    unmetAcceptance: Gap[]
    /** Swim steps not linked to any feature (untraceable). */
    stepsWithoutFeature: Gap[]
    /** Features/steps a VCS webhook flagged as drifted from their code. */
    staleNodes: Gap[]
    /** Features/steps whose description is over the writing-contract budget — compact them. */
    bloatedDescriptions: Gap[]
  }
}

const committed = (s: FeatureStatus) => s === 'must' || s === 'progress'

export function deriveOverview(data: WorkspaceData, threshold = DEFAULT_IMPACT_THRESHOLD, org?: OrgAlertCtx): Overview {
  const features = { total: data.features.length, must: 0, progress: 0, done: 0, nice: 0 } as Overview['features']
  for (const f of data.features) features[f.status]++
  const steps = { total: data.swimNodes.length, todo: 0, progress: 0, done: 0, blocked: 0 } as Overview['steps']
  for (const n of data.swimNodes) steps[n.status]++

  const list = deriveAllAlerts(data, threshold, org)
  const by = (k: Alert['kind']) => list.filter((a) => a.kind === k).length
  const alerts = { impact: by('impact'), outdated: by('outdated'), dod: by('dod'), question: by('question'), friction: by('friction'), total: list.length, list }

  // A step is traceable if some feature crossLinks into it (link_feature_step writes this).
  const linkedNodes = new Set<string>()
  for (const f of data.features) for (const l of f.crossLinks ?? []) if (l.view === 'swimlane' && l.targetId) linkedNodes.add(l.targetId)

  const featuresWithoutCode: Gap[] = data.features
    .filter((f) => committed(f.status) && !(f.codeRefs?.length))
    .map((f) => ({ kind: 'feature', id: f.id, label: f.name }))
  const unmetAcceptance: Gap[] = data.features
    .filter((f) => committed(f.status) && (f.validations?.length ?? 0) > (f.validationsDone ?? []).filter((t) => f.validations!.includes(t)).length)
    .map((f) => ({ kind: 'feature', id: f.id, label: f.name }))
  const stepsWithoutFeature: Gap[] = data.swimNodes
    .filter((n) => !linkedNodes.has(n.id))
    .map((n) => ({ kind: 'swimnode', id: n.id, label: n.label }))
  const staleNodes: Gap[] = [
    ...data.features.filter((f) => f.codeStale).map((f) => ({ kind: 'feature' as const, id: f.id, label: f.name })),
    ...data.swimNodes.filter((n) => n.codeStale).map((n) => ({ kind: 'swimnode' as const, id: n.id, label: n.label })),
  ]
  const moduleName = new Map(data.modules.map((m) => [m.id, m.name]))
  const bloatedDescriptions: Gap[] = [
    ...data.features
      .filter((f) => isDescOverBudget(f.desc) && !isSteeringFeature(f, moduleName.get(f.moduleId), data.settings?.contextFeatureId))
      .map((f) => ({ kind: 'feature' as const, id: f.id, label: f.name })),
    ...data.swimNodes.filter((n) => isDescOverBudget(n.desc)).map((n) => ({ kind: 'swimnode' as const, id: n.id, label: n.label })),
  ]

  return { features, steps, alerts, fidelity: { featuresWithoutCode, unmetAcceptance, stepsWithoutFeature, staleNodes, bloatedDescriptions } }
}
