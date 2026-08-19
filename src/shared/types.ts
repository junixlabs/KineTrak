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
  /** Feature id owning this step's flow (feature-scoped swimlane). Required on new
   *  steps (docs/BOARD_QUALITY.md); optional only for legacy/pre-migration data, which
   *  validate_board flags as unscoped_step (it renders in every flow view). */
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

// cm:edge lockstep -> src/lib/overview.ts — a new kind needs its own count key in Overview['alerts']
export type AlertKind = 'impact' | 'outdated' | 'dod' | 'question' | 'friction'

/** Where an alert's action button navigates: a project view + selection, or an
 *  org board (optionally focusing one integration edge). */
export type AlertAction =
  | { view: ViewId; selection: Selection | null }
  | { view: 'orgboard'; boardId: string; edge?: { from: string; to: string } }

export interface Alert {
  id: string
  kind: AlertKind
  title: string
  detail: string
  tags: string[]
  time: string
  actionLabel: string
  action: AlertAction
  /** For kind 'question' (async human-decision channel). */
  options?: string[]
  /** The human's answer to a 'question' alert; unset while pending. */
  answer?: string
}

// cm:why Selection is domain, not UI: the persisted AlertAction embeds it, so this shape
// round-trips through the store and the server. src/store/types.ts re-exports it by name.
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

// ── Org boards (system maps) ─────────────────────────────────────────────────

export type OrgBoardEdgeKind = 'api' | 'event' | 'data' | 'other'

/** A system on an org board — usually one of the org's projects; without a
 *  projectId it is an external/third-party system drawn for context. */
export interface OrgBoardNode {
  id: string
  projectId?: string
  label: string
  x: number
  y: number
  desc?: string
}

/** An integration between two systems. `desc` holds the contract detail
 *  (endpoints, events, payloads) — context-in-card, hidden until clicked.
 *  `fromFeatureId`/`toFeatureId` anchor each end to a feature inside the
 *  project of the node at that end — the joint that lets impact and drift
 *  reason across projects. Anchors may dangle (feature deleted later);
 *  validation reports them, deletes never cascade across boards. */
export interface OrgBoardEdge {
  from: string
  to: string
  label?: string
  kind?: OrgBoardEdgeKind
  desc?: string
  fromFeatureId?: string
  toFeatureId?: string
  /** Code implementing this contract on either side (webhook watches these). */
  codeRefs?: CodeRef[]
  /** Set by a VCS webhook when linked code changed after the contract was last updated. */
  codeStale?: boolean
}

/** An org-level system map: how the org's projects/services work together.
 *  An org can hold any number of boards (one per domain slice, env, …). */
export interface OrgBoard {
  id: string
  orgId: string
  name: string
  createdAt: string
  nodes: OrgBoardNode[]
  edges: OrgBoardEdge[]
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
