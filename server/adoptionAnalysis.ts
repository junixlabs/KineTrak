// ── Abandonment-signal analysis (pure) ──────────────────────────────────────
// NORTH-STAR.md §5 counts people who made a DECISION using compute_impact. The
// inverse is the measurement nobody asks for: a board that grew nodes and was
// never queried is a drawing, and the product failed its own promise without a
// single complaint — board count up, node count up, no error reported.
//
// So this measures the silence. Two facts per board: how far up the modelling
// ladder it climbed, and whether anyone ever asked it a question.
//
// cm:guard no DB import, no clock, no randomness. Every result is a function of the rows passed
// in, which is what makes the report re-runnable with a byte-identical answer (AC6).

import { blankTemplate, sampleTemplate } from '../src/shared/seed'
import type { WorkspaceData } from '../src/shared/types'

/** The modelling ladder, shallow → deep. A board's position is the DEEPEST rung
 *  whose predicate holds; `rungs` reports every rung it satisfies, so a gap is
 *  visible rather than filled in. */
export type Rung = 'created' | 'drawn' | 'specified' | 'connected' | 'linked' | 'queried'

export const RUNGS: readonly Rung[] = ['created', 'drawn', 'specified', 'connected', 'linked', 'queried']

/** The rung at which the board becomes answerable, reported so a reader knows which
 *  part of the ladder `queryReadyButUnqueried` counts. Membership is decided by the
 *  `connected` predicate itself, never by depth on the ladder — see `classifyBoard`. */
export const QUERY_READY_RUNG: Rung = 'connected'

/** What the board doc says about itself. Board STATE, not log events: `activity`
 *  is a 1000-row ring per project, so an old board's `addModule` is long gone and
 *  classifying from events would read a mature board as empty. */
export interface BoardFacts {
  projectId: string
  name: string
  /** ISO string from the catalog header — durable, never trimmed. */
  createdAt: string
  /** Modules + features + swim steps. 0 = nothing was ever drawn. */
  nodes: number
  /** Some feature or step carries desc / constraints / validations. */
  specified: boolean
  /** The impact engine has at least one edge to walk (see `connectedness`). */
  connected: boolean
  /** codeRefs on a feature or step — `link_code` happened. */
  linked: boolean
  /** The board is still byte-for-byte a freshly seeded template: nobody built it. */
  seeded: boolean
}

/** One recorded impact query. `tool_calls` is the only record of these: the tools
 *  are pure reads and write no `activity` row. */
export interface ImpactQuery {
  projectId: string | null
  ts: number
}

/** Per-project narration totals — what `activity` is genuinely good for here:
 *  telling a board that stalled today from one that stalled two years ago. */
export interface ActivitySpan {
  projectId: string
  rows: number
  firstTs: number
  lastTs: number
}

export interface BoardAdoption {
  projectId: string
  name: string
  createdAt: string
  /** `model` = queried. `drawing` = someone built it and never queried it.
   *  `seeded` = still the untouched shipped template. `empty` = no nodes. The last
   *  two are counted apart so they inflate neither side of the ratio. */
  verdict: 'model' | 'drawing' | 'seeded' | 'empty'
  furthest: Rung
  rungs: Rung[]
  nodes: number
  /** The impact engine has an edge to walk, so the board CAN answer — asked or not. */
  queryReady: boolean
  impactQueries: number
  lastQueryAt: number | null
  firstActivityAt: number | null
  lastActivityAt: number | null
  activityRows: number
}

export interface Cohort {
  /** 'YYYY-MM' or ISO 'YYYY-Www' — the bucket of the board's creation date. */
  bucket: string
  boards: number
  model: number
  drawing: number
  seeded: number
  empty: number
  /** model / (model + drawing), or null when the cohort holds neither. */
  modelRatio: number | null
}

export interface AdoptionReport {
  boards: number
  model: number
  drawing: number
  /** Untouched shipped templates. Every new account is seeded with one, so this is
   *  a count of workspaces nobody opened — NOT of modelling that went unused. */
  seeded: number
  empty: number
  modelRatio: number | null
  /** Built boards the impact engine could have answered, that nobody asked. Seeded
   *  and empty boards are excluded: neither represents modelling work someone did. */
  queryReadyButUnqueried: number
  /** Drawings carrying at most one retained narration entry — a template somebody
   *  nudged once reads as built work, because any edit at all breaks the seeded
   *  fingerprint. A HINT, not a verdict: the narration log is trimmed, and a board
   *  older than it has none, so a high number here means read `boardsDetail`. */
  drawingsBarelyEdited: number
  /** Drawing boards grouped by where they stopped, in ladder order. Rungs with
   *  no boards are kept so the shape of the drop-off reads at a glance. */
  stoppedAt: { rung: Rung; boards: number }[]
  trend: Cohort[]
  boardsDetail: BoardAdoption[]
}

export type Bucket = 'week' | 'month'

const nonEmpty = (s?: string): boolean => !!s && s.trim().length > 0
const someText = (xs?: string[]): boolean => !!xs && xs.some(nonEmpty)

/**
 * Whether the impact engine has anything to walk. Each disjunct is a real edge
 * type in `src/lib/impact.ts`, which is why "connected" means answerable and not
 * merely "looks joined up on screen":
 *   swimEdges       → reachableFrom, the downstream propagation
 *   feature.dependsOn → dependentsOf, the cross-feature ripple
 *   swimlane crossLink resolving to a live step → entryNodesFor, which is the only
 *                     way a FEATURE focus reaches the flow at all
 */
// cm:edge contract -> src/lib/impact.ts — these three disjuncts are exactly what computeImpact traverses; a new axis in the engine must be added here or an answerable board still reads as a drawing.
export function connectedness(data: WorkspaceData): boolean {
  if (data.swimEdges.length > 0) return true
  if (data.features.some((f) => (f.dependsOn ?? []).length > 0)) return true
  const nodeIds = new Set(data.swimNodes.map((n) => n.id))
  return data.features.some((f) => (f.crossLinks ?? []).some((l) => l.view === 'swimlane' && l.targetId && nodeIds.has(l.targetId)))
}

/**
 * Order-independent structural fingerprint of a board. Object keys are sorted
 * because a board round-trips through Postgres `jsonb`, which does not preserve
 * insertion order — a plain JSON.stringify would compare unequal for a board that
 * is in fact untouched. Array order is preserved (jsonb preserves it too).
 */
// cm:guard sort the KEYS, never the arrays: node and edge order is real board content, and sorting
// it would make two genuinely different boards fingerprint alike.
// cm:why a `seen` set although no current caller can pass a cycle (boards come from jsonb or the acyclic seed constants): isSeeded is exported, and for a caller handing it an in-memory graph a marker beats a hang.
function fingerprint(value: unknown, seen: Set<object> = new Set()): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (seen.has(value)) return '"[cycle]"'
  seen.add(value)
  const out = Array.isArray(value)
    ? `[${value.map((v) => fingerprint(v, seen)).join(',')}]`
    : `{${Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => `${JSON.stringify(k)}:${fingerprint(v, seen)}`)
        .join(',')}}`
  seen.delete(value)
  return out
}

/**
 * Whether the board is still exactly what KineTrak shipped it as.
 *
 * This is load-bearing, not cosmetic: `server/index.ts` seeds EVERY new account
 * with `sampleTemplate` — 27 nodes carrying descriptions, swim edges and codeRefs.
 * Judged on content alone that board is born at rung `linked` with `connected`
 * true, so an account nobody ever opened would be reported as a fully modelled
 * board that nobody queried. The metric would manufacture the exact signal it
 * exists to detect, in the flattering-to-the-diagnosis direction.
 *
 * An exact fingerprint match is used rather than a heuristic because the templates
 * are constants with stable ids: any edit at all, including deleting one node,
 * makes the board somebody's work.
 */
// cm:edge lockstep -> src/shared/seed.ts — compared against sampleTemplate/blankTemplate BY VALUE, so editing a template makes already-seeded boards read as built; change one and re-read this report's `seeded` count.
// cm:why by value and not by a stored provenance flag: recording "this board came from a template" would be a write, which the report is forbidden. The cost is that a board restored to a pre-edit snapshot re-enters `seeded` despite its history — visible in activityRows, and defensible, since it currently holds no modelling.
export function isSeeded(data: WorkspaceData): boolean {
  const fp = fingerprint(data)
  return TEMPLATE_FINGERPRINTS.includes(fp)
}

/** Computed once: the templates are constants, and an org-wide report would otherwise
 *  re-fingerprint a 27-node board twice per project. */
const TEMPLATE_FINGERPRINTS: readonly string[] = [fingerprint(sampleTemplate), fingerprint(blankTemplate())]

/** Reduce one board to the facts the ladder needs. Pure over the board doc. */
export function boardFacts(p: { id: string; name: string; createdAt: string; data: WorkspaceData }): BoardFacts {
  const d = p.data
  const specified =
    d.features.some((f) => nonEmpty(f.desc) || someText(f.constraints) || someText(f.validations)) ||
    d.swimNodes.some((n) => nonEmpty(n.desc) || someText(n.constraints) || someText(n.validations))
  const linked =
    d.features.some((f) => (f.codeRefs ?? []).length > 0) || d.swimNodes.some((n) => (n.codeRefs ?? []).length > 0)
  return {
    projectId: p.id,
    name: p.name,
    createdAt: p.createdAt,
    nodes: d.modules.length + d.features.length + d.swimNodes.length,
    specified,
    connected: connectedness(d),
    linked,
    seeded: isSeeded(d),
  }
}

/** Every rung this board satisfies, in ladder order. `created` always holds — the
 *  project exists. */
export function rungsOf(f: BoardFacts, queried: boolean): Rung[] {
  const out: Rung[] = ['created']
  if (f.nodes > 0) out.push('drawn')
  if (f.specified) out.push('specified')
  if (f.connected) out.push('connected')
  if (f.linked) out.push('linked')
  if (queried) out.push('queried')
  return out
}

/** Verdict precedence: being queried outranks everything (a seeded board someone
 *  actually asked a question of IS a model), then untouched-template, then built,
 *  then bare. */
function verdictOf(f: BoardFacts, queried: boolean): BoardAdoption['verdict'] {
  if (queried) return 'model'
  if (f.seeded) return 'seeded'
  return f.nodes > 0 ? 'drawing' : 'empty'
}

export function classifyBoard(f: BoardFacts, queries: ImpactQuery[], span?: ActivitySpan): BoardAdoption {
  const queried = queries.length > 0
  const rungs = rungsOf(f, queried)
  const furthest = rungs[rungs.length - 1]
  return {
    projectId: f.projectId,
    name: f.name,
    createdAt: f.createdAt,
    verdict: verdictOf(f, queried),
    furthest,
    rungs,
    nodes: f.nodes,
    // cm:guard read the connectedness PREDICATE, never the depth of `furthest`: rungs are a set, so a board that linked code without connecting the graph outranks `connected` while computeImpact returns nothing.
    queryReady: f.connected,
    impactQueries: queries.length,
    // cm:why reduce, not Math.max(...spread): the query list is bounded only by the tool-call log
    // cap, and a spread of that many arguments is a RangeError rather than a slow answer.
    lastQueryAt: queried ? queries.reduce((max, q) => (q.ts > max ? q.ts : max), -Infinity) : null,
    firstActivityAt: span ? span.firstTs : null,
    lastActivityAt: span ? span.lastTs : null,
    activityRows: span ? span.rows : 0,
  }
}

/** A ratio with a fixed 4-decimal shape, so two runs over the same rows compare
 *  byte-for-byte. null when there is no non-empty board to divide. */
function ratio(model: number, drawing: number): number | null {
  const denom = model + drawing
  return denom === 0 ? null : Math.round((model / denom) * 10_000) / 10_000
}

/** ISO-8601 week-numbering year and week of a UTC date — Thursday rule. Derived
 *  from the passed-in date string only; no clock is read. */
export function isoWeek(d: Date): { year: number; week: number } {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  // cm:why shifted to Thursday before reading the year: an ISO week belongs to the year holding its Thursday, so weeks 1 and 53 straddle a year boundary and the calendar year of the date itself is the wrong key.
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7))
  const yearStart = Date.UTC(x.getUTCFullYear(), 0, 1)
  return { year: x.getUTCFullYear(), week: Math.ceil(((x.getTime() - yearStart) / 86_400_000 + 1) / 7) }
}

/** The cohort key for a creation date. An unparseable date buckets to 'unknown'
 *  rather than throwing or landing on the epoch, which would fake a 1970 cohort. */
export function bucketKey(createdAt: string, bucket: Bucket): string {
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return 'unknown'
  if (bucket === 'month') return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  const { year, week } = isoWeek(d)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** The tools that constitute "someone asked the board a question". Both are pure
 *  reads over the impact engine, which is exactly why `tool_calls` is the only
 *  place they appear — neither writes an `activity` row. */
// cm:edge contract -> server/mcp.ts — the first two are literal registerTool names. Renaming a tool there
// without renaming it here makes every board read as never-queried, which looks like data, not a bug.
// cm:edge contract -> server/toolLog.ts PANEL_IMPACT_QUERY — a person asking from the feature panel.
export const IMPACT_QUERY_TOOLS: readonly string[] = ['compute_impact', 'compute_org_impact', 'panel_impact_query']

export interface ToolCallLike {
  projectId: string | null
  tool: string
  outcome: 'ok' | 'error'
  ts: number
}

/**
 * Pull the impact queries out of a tool-call window.
 *
 * Only an `ok` call counts as a query: an errored one means nobody received an
 * answer, so counting it would credit the board with a capability it did not
 * deliver. The failures are returned separately because "someone asked and the
 * product failed them" is the one thing worse than never being asked.
 */
export function splitImpactQueries(rows: ToolCallLike[]): { queries: ImpactQuery[]; failed: number } {
  const queries: ImpactQuery[] = []
  let failed = 0
  for (const r of rows) {
    if (!IMPACT_QUERY_TOOLS.includes(r.tool)) continue
    if (r.outcome === 'ok') queries.push({ projectId: r.projectId, ts: r.ts })
    else failed++
  }
  return { queries, failed }
}

export interface AdoptionInput {
  boards: BoardFacts[]
  impactQueries: ImpactQuery[]
  activity: ActivitySpan[]
}

/**
 * The report. Boards come from board state; `impactQueries` decides the top rung;
 * `activity` only supplies liveness. Cohorts are keyed on board CREATION date, so
 * the trend answers "are boards we create lately more likely to be queried" —
 * a lifetime ratio cannot show a direction of travel.
 */
export function analyzeAdoption(input: AdoptionInput, opts: { bucket?: Bucket } = {}): AdoptionReport {
  const bucket = opts.bucket ?? 'month'

  const queriesByProject = new Map<string, ImpactQuery[]>()
  for (const q of input.impactQueries) {
    if (!q.projectId) continue
    const list = queriesByProject.get(q.projectId)
    if (list) list.push(q)
    else queriesByProject.set(q.projectId, [q])
  }
  const spanByProject = new Map(input.activity.map((a) => [a.projectId, a]))

  // cm:guard sorted by projectId, not by any score: the detail list is the re-runnability surface,
  // and a score sort over equal scores is a partial order that reshuffles between identical runs.
  const boardsDetail = [...input.boards]
    .map((f) => classifyBoard(f, queriesByProject.get(f.projectId) ?? [], spanByProject.get(f.projectId)))
    .sort((a, b) => a.projectId.localeCompare(b.projectId))

  const count = (v: BoardAdoption['verdict']) => boardsDetail.filter((b) => b.verdict === v).length
  const model = count('model')
  const drawing = count('drawing')

  const stoppedCount = new Map<Rung, number>(RUNGS.map((r) => [r, 0]))
  // cm:guard drawings ONLY: an empty or seeded board's furthest rung is one no drawing can occupy, so admitting other verdicts reads as abandonment where no work happened.
  for (const b of boardsDetail) {
    if (b.verdict !== 'drawing') continue
    stoppedCount.set(b.furthest, (stoppedCount.get(b.furthest) ?? 0) + 1)
  }

  const cohorts = new Map<string, Cohort>()
  for (const b of boardsDetail) {
    const key = bucketKey(b.createdAt, bucket)
    let c = cohorts.get(key)
    if (!c) cohorts.set(key, (c = { bucket: key, boards: 0, model: 0, drawing: 0, seeded: 0, empty: 0, modelRatio: null }))
    c.boards++
    c[b.verdict]++
  }
  for (const c of cohorts.values()) c.modelRatio = ratio(c.model, c.drawing)

  return {
    boards: boardsDetail.length,
    model,
    drawing,
    seeded: count('seeded'),
    empty: count('empty'),
    modelRatio: ratio(model, drawing),
    queryReadyButUnqueried: boardsDetail.filter((b) => b.verdict === 'drawing' && b.queryReady).length,
    drawingsBarelyEdited: boardsDetail.filter((b) => b.verdict === 'drawing' && b.activityRows <= 1).length,
    // cm:why every rung is emitted, including zeros: the drop-off is read as a shape, and a rung
    // silently absent looks like a rung nobody stops at rather than one nobody reaches.
    // cm:why `created` and `queried` are both omitted: a drawing has nodes so it never stops at
    // `created`, and a queried board is a model, so both rows could only ever read zero.
    stoppedAt: RUNGS.filter((r) => r !== 'created' && r !== 'queried').map((rung) => ({ rung, boards: stoppedCount.get(rung) ?? 0 })),
    trend: [...cohorts.values()].sort((a, b) => a.bucket.localeCompare(b.bucket)),
    boardsDetail,
  }
}
