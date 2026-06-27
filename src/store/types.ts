// ── Domain types ───────────────────────────────────────────────────────────

export type ViewId = 'mindmap' | 'story' | 'swimlane'

export type FeatureStatus = 'must' | 'progress' | 'done' | 'nice'
export type NodeStatus = 'done' | 'progress' | 'todo' | 'blocked'

/** Roles used by the role filter; owners map to one or more of these. */
export type Role = 'PM' | 'PO' | 'BA' | 'Dev' | 'Tester'

export interface Module {
  id: string
  name: string
  color: string
  /** Backbone column label + sub used by the Story Map (same id as module). */
  backbone: { name: string; sub: string }
  owners: Role[]
}

export interface CrossLink {
  view: ViewId
  label: string
  /** Optional target id to select on navigation. */
  targetId?: string
}

export interface Feature {
  id: string
  moduleId: string
  name: string
  status: FeatureStatus
  releaseId: string
  desc?: string
  constraints?: string[]
  validations?: string[]
  crossLinks?: CrossLink[]
}

export interface Release {
  id: string
  name: string
  tag: string
  color: string
  bg: string
  bdr: string
}

export type NodeKind = 'start' | 'process' | 'decision' | 'end'

export interface SwimLane {
  id: number
  name: string
  sub: string
  color: string
  owners: Role[]
  /** Band geometry on the swimlane canvas — lives on the data model, not a side table. */
  y: number
  h: number
}

export interface SwimNode {
  id: string
  label: string
  lane: number
  kind: NodeKind
  status: NodeStatus
  /** Layout position on the swimlane canvas. */
  x: number
  y: number
  desc?: string
  owner?: string
  ownerInit?: string
  ownerColor?: string
  constraints?: string[]
  validations?: string[]
  crossLinks?: CrossLink[]
}

export interface SwimEdge {
  from: string
  to: string
  branch?: string
}

export interface Snapshot {
  id: string
  name: string
  date: string
  tag: string
  tagColor: string
  tagBg: string
  dot: string
}

export type AlertKind = 'impact' | 'outdated' | 'dod'

export interface Alert {
  id: string
  kind: AlertKind
  title: string
  detail: string
  tags: string[]
  time: string
  actionLabel: string
  action: { view: ViewId; selection: Selection | null }
}

// ── Selection / UI ───────────────────────────────────────────────────────────

export type Selection =
  | { type: 'feature'; id: string; view: ViewId }
  | { type: 'module'; id: string; view: ViewId }
  | { type: 'swimnode'; id: string; view: ViewId }

export interface WorkspaceData {
  modules: Module[]
  features: Feature[]
  releases: Release[]
  lanes: SwimLane[]
  swimNodes: SwimNode[]
  swimEdges: SwimEdge[]
  snapshots: Snapshot[]
  alerts: Alert[]
}

/**
 * User edits persisted as id-keyed deltas on top of the canonical seed.
 * Keeping only deltas (never the whole graph) means a seed-shape change can never
 * be shadowed by stale storage: unknown ids are simply ignored, new seed content
 * always appears. This is the persistence boundary for the SSOT.
 */
export interface Overrides {
  featureStatus: Record<string, FeatureStatus>
  featureRelease: Record<string, string>
  swimStatus: Record<string, NodeStatus>
}

export const emptyOverrides = (): Overrides => ({ featureStatus: {}, featureRelease: {}, swimStatus: {} })
