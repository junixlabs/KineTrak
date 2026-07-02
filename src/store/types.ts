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
  /** Pin the Mindmap branch to one side of the root; unset = auto-balanced. */
  side?: 'left' | 'right'
}

export interface CrossLink {
  view: ViewId
  label: string
  /** Optional target id to select on navigation. */
  targetId?: string
}

/** A structured pointer from a board node into the codebase — the neck that lets
 *  KineTrak be a source of truth for business logic and detect code drift. */
export interface CodeRef {
  /** Repo-relative path (file or directory). */
  path: string
  /** Optional function/class/symbol within the file. */
  symbol?: string
  /** Optional permalink to the PR / commit / line range. */
  url?: string
  /** Last commit sha the board node was reconciled against (drift detection). */
  sha?: string
}

export interface Feature {
  id: string
  moduleId: string
  name: string
  status: FeatureStatus
  releaseId: string
  /** Parent feature (same module) — one nesting level only: a parent never has a
   *  parent of its own. Gives the mindmap an epic → sub-feature level; Story Map,
   *  releases and the impact engine keep treating features flat. */
  parentId?: string
  desc?: string
  constraints?: string[]
  validations?: string[]
  /** Subset of `validations` checked off (matched by text) — the tester checklist. */
  validationsDone?: string[]
  crossLinks?: CrossLink[]
  /** Code artifacts this feature is implemented by (for impact + drift). */
  codeRefs?: CodeRef[]
  /** Other feature ids this feature depends on (changing them impacts this one). */
  dependsOn?: string[]
  /** Set by a VCS webhook when linked code changed after the node was last updated. */
  codeStale?: boolean
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
  /** Short display chip (A, B, …). Auto-assigned for new nodes since id is now a uuid. */
  code?: string
  label: string
  lane: number
  /** Feature id owning this step's flow (feature-scoped swimlane). Unset = legacy
   *  shared canvas: the step shows in every flow view. */
  flowId?: string
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
  /** Subset of `validations` checked off (matched by text) — the tester checklist. */
  validationsDone?: string[]
  crossLinks?: CrossLink[]
  /** Code artifacts this step is implemented by (for impact + drift). */
  codeRefs?: CodeRef[]
  /** Set by a VCS webhook when linked code changed after the node was last updated. */
  codeStale?: boolean
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
  /** Frozen copy of the project's data at capture time (read-only history). */
  data: WorkspaceData
}

export type AlertKind = 'impact' | 'outdated' | 'dod' | 'question'

export interface Alert {
  id: string
  kind: AlertKind
  title: string
  detail: string
  tags: string[]
  time: string
  actionLabel: string
  action: { view: ViewId; selection: Selection | null }
  /** For kind 'question' (async human-decision channel). */
  options?: string[]
  /** The human's answer to a 'question' alert; unset while pending. */
  answer?: string
}

// ── Selection / UI ───────────────────────────────────────────────────────────

export type Selection =
  | { type: 'feature'; id: string; view: ViewId }
  | { type: 'module'; id: string; view: ViewId }
  | { type: 'swimnode'; id: string; view: ViewId }

/** What this board is to its project: the operational source of truth, a derived
 *  map of truth held elsewhere (verify against truthPointers before acting), or an
 *  as-built snapshot of an onboarded codebase (statuses mean "exists", not "shipped"). */
export type BoardRole = 'ssot' | 'map' | 'asis-doc'

/** Where the operational truth lives when the board is not it (tracker, git, CI…). */
export interface TruthPointer {
  name: string
  url?: string
}

/** Per-project tunables (persisted with the board). */
export interface WorkspaceSettings {
  /** Min downstream-step footprint for a linked feature to raise an impact alert. */
  impactThreshold?: number
  boardRole?: BoardRole
  truthPointers?: TruthPointer[]
  /** The steering Meta/Project Context feature, pinned by id (names drift, ids don't). */
  contextFeatureId?: string
}

/** The editable diagram graph owned by a project (and frozen inside each snapshot). */
export interface WorkspaceData {
  modules: Module[]
  features: Feature[]
  releases: Release[]
  lanes: SwimLane[]
  swimNodes: SwimNode[]
  swimEdges: SwimEdge[]
  alerts: Alert[]
  settings?: WorkspaceSettings
}

// ── Multi-project / org ──────────────────────────────────────────────────────

export interface Org {
  id: string
  name: string
  /** Owning user (set in server/account mode; absent in local-only mode). */
  ownerId?: string
}

export interface Project {
  id: string
  orgId: string
  name: string
  createdAt: string
  /** The live, editable graph. */
  data: WorkspaceData
  /** Frozen historical snapshots (version control). */
  snapshots: Snapshot[]
}

/** A project without its heavy board payload — the catalog view used for listing
 *  and scoping (server keeps these resident; full `data` loads on demand). */
export type ProjectHeader = Pick<Project, 'id' | 'orgId' | 'name' | 'createdAt'>

export type ProjectTemplate = 'sample' | 'blank'

/** Authenticated account (server mode). Never carries the password hash. */
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}
