import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { blankTemplate, sampleTemplate, templateData } from '../src/shared/seed'
import { computeImpact } from '../src/lib/impact'
import type { Feature, SwimNode, WorkspaceData } from '../src/shared/types'
import {
  analyzeAdoption,
  boardFacts,
  bucketKey,
  classifyBoard,
  connectedness,
  IMPACT_QUERY_TOOLS,
  isoWeek,
  isSeeded,
  QUERY_READY_RUNG,
  RUNGS,
  rungsOf,
  splitImpactQueries,
  type ActivitySpan,
  type BoardFacts,
  type ImpactQuery,
  type Rung,
  type ToolCallLike,
} from './adoptionAnalysis'

const emptyData = (): WorkspaceData => ({
  modules: [],
  features: [],
  releases: [],
  lanes: [],
  swimNodes: [],
  swimEdges: [],
  alerts: [],
})

const feature = (id: string, over: Partial<Feature> = {}): Feature => ({
  id,
  moduleId: 'm1',
  name: `feature ${id}`,
  status: 'must',
  releaseId: 'r1',
  ...over,
})

const step = (id: string, over: Partial<SwimNode> = {}): SwimNode => ({
  id,
  label: `step ${id}`,
  lane: 1,
  kind: 'process',
  status: 'todo',
  x: 0,
  y: 0,
  ...over,
})

const board = (id: string, data: WorkspaceData, createdAt = '2026-01-15T00:00:00.000Z') => ({
  id,
  name: `board ${id}`,
  createdAt,
  data,
})

/** A board at exactly one rung, so a test names the rung it is pinning. */
function dataAtRung(rung: Rung): WorkspaceData {
  const d = emptyData()
  if (rung === 'created') return d
  d.modules.push({ id: 'm1', name: 'M', color: '#fff', backbone: { name: 'M', sub: '' }, owners: [] })
  d.features.push(feature('f1'))
  d.swimNodes.push(step('n1'))
  if (rung === 'drawn') return d
  d.features[0] = feature('f1', { desc: 'what this feature means' })
  if (rung === 'specified') return d
  d.swimNodes.push(step('n2'))
  d.swimEdges.push({ from: 'n1', to: 'n2' })
  if (rung === 'connected') return d
  d.features[0] = feature('f1', { desc: 'what this feature means', codeRefs: [{ path: 'src/x.ts' }] })
  return d
}

test('the ladder is ordered shallow → deep and queryReadyFrom sits on it', () => {
  assert.deepEqual([...RUNGS], ['created', 'drawn', 'specified', 'connected', 'linked', 'queried'])
  assert.ok(RUNGS.includes(QUERY_READY_RUNG))
})

test('each rung is reachable and a board reports stopping exactly there', () => {
  for (const rung of ['created', 'drawn', 'specified', 'connected', 'linked'] as Rung[]) {
    const facts = boardFacts(board('p', dataAtRung(rung)))
    const got = classifyBoard(facts, [])
    assert.equal(got.furthest, rung, `expected a board built for ${rung} to stop at ${rung}`)
    assert.equal(got.rungs.at(-1), rung)
  }
})

test('a query is the top rung and is the only thing that makes a board a model', () => {
  const facts = boardFacts(board('p', dataAtRung('drawn')))
  assert.equal(classifyBoard(facts, []).verdict, 'drawing')
  const queried = classifyBoard(facts, [{ projectId: 'p', ts: 5 }])
  assert.equal(queried.verdict, 'model')
  assert.equal(queried.furthest, 'queried')
  assert.equal(queried.lastQueryAt, 5)
})

test('an empty board is neither a model nor a drawing', () => {
  const got = classifyBoard(boardFacts(board('p', emptyData())), [])
  assert.equal(got.verdict, 'empty')
  assert.equal(got.furthest, 'created')
  assert.equal(got.nodes, 0)
})

test('rungs are reported as a set, so a gap stays visible instead of being filled in', () => {
  // cm:why a real board can skip a rung (code linked, nothing specified) and the set must show the hole: inventing the missing rung would tidy the ladder by lying about the board.
  const d = emptyData()
  d.features.push(feature('f1', { codeRefs: [{ path: 'src/x.ts' }] }))
  const facts = boardFacts(board('p', d))
  assert.deepEqual(rungsOf(facts, false), ['created', 'drawn', 'linked'])
  assert.equal(classifyBoard(facts, []).furthest, 'linked')
})

test('specified counts constraints and validations, not only desc', () => {
  const withConstraints = emptyData()
  withConstraints.features.push(feature('f1', { constraints: ['must be idempotent'] }))
  assert.equal(boardFacts(board('p', withConstraints)).specified, true)

  const withStepValidations = emptyData()
  withStepValidations.swimNodes.push(step('n1', { validations: ['returns 200'] }))
  assert.equal(boardFacts(board('p', withStepValidations)).specified, true)

  const whitespaceOnly = emptyData()
  whitespaceOnly.features.push(feature('f1', { desc: '   ', validations: ['', '  '] }))
  assert.equal(boardFacts(board('p', whitespaceOnly)).specified, false, 'blank text is not a spec')
})

test('connectedness holds for each axis the impact engine actually walks', () => {
  const edges = emptyData()
  edges.swimNodes.push(step('n1'), step('n2'))
  edges.swimEdges.push({ from: 'n1', to: 'n2' })
  assert.equal(connectedness(edges), true, 'swimEdges → reachableFrom')

  const deps = emptyData()
  deps.features.push(feature('f1', { dependsOn: ['f2'] }), feature('f2'))
  assert.equal(connectedness(deps), true, 'dependsOn → dependentsOf')

  const cross = emptyData()
  cross.swimNodes.push(step('n1'))
  cross.features.push(feature('f1', { crossLinks: [{ view: 'swimlane', label: 'n1', targetId: 'n1' }] }))
  assert.equal(connectedness(cross), true, 'swimlane crossLink → entryNodesFor')
})

test('a crossLink pointing at a deleted step does not count as connected', () => {
  // cm:why a dangling crossLink is NOT connected: entryNodesFor filters on live swimNodes, so it resolves to nothing and the board genuinely cannot answer.
  const d = emptyData()
  d.swimNodes.push(step('n1'))
  d.features.push(feature('f1', { crossLinks: [{ view: 'swimlane', label: 'gone', targetId: 'deleted' }] }))
  assert.equal(connectedness(d), false)

  const mindmapOnly = emptyData()
  mindmapOnly.swimNodes.push(step('n1'))
  mindmapOnly.features.push(feature('f1', { crossLinks: [{ view: 'mindmap', label: 'n1', targetId: 'n1' }] }))
  assert.equal(connectedness(mindmapOnly), false, 'only a swimlane link reaches the flow')
})

test('only a successful impact call counts as a query; failures are reported apart', () => {
  const rows: ToolCallLike[] = [
    { projectId: 'p1', tool: 'compute_impact', outcome: 'ok', ts: 10 },
    { projectId: 'p1', tool: 'compute_impact', outcome: 'error', ts: 11 },
    { projectId: 'p2', tool: 'compute_org_impact', outcome: 'ok', ts: 12 },
    { projectId: 'p2', tool: 'get_board', outcome: 'ok', ts: 13 },
    { projectId: 'p3', tool: 'add_feature', outcome: 'ok', ts: 14 },
  ]
  const { queries, failed } = splitImpactQueries(rows)
  assert.deepEqual(queries, [
    { projectId: 'p1', ts: 10 },
    { projectId: 'p2', ts: 12 },
  ])
  assert.equal(failed, 1)
})

test('the impact tool names are the ones the MCP layer registers, plus a person asking from the panel', () => {
  assert.deepEqual([...IMPACT_QUERY_TOOLS], ['compute_impact', 'compute_org_impact', 'panel_impact_query'])
})

test('the report splits model / drawing / empty and never counts empty in the ratio', () => {
  const boards: BoardFacts[] = [
    boardFacts(board('p1', dataAtRung('linked'))),
    boardFacts(board('p2', dataAtRung('drawn'))),
    boardFacts(board('p3', emptyData())),
  ]
  const r = analyzeAdoption({ boards, impactQueries: [{ projectId: 'p1', ts: 1 }], activity: [] })
  assert.equal(r.boards, 3)
  assert.equal(r.model, 1)
  assert.equal(r.drawing, 1)
  assert.equal(r.empty, 1)
  assert.equal(r.modelRatio, 0.5, '1 model over 2 non-empty boards, the empty one excluded')
})

test('modelRatio is null rather than zero when there is nothing to divide', () => {
  const r = analyzeAdoption({ boards: [boardFacts(board('p1', emptyData()))], impactQueries: [], activity: [] })
  assert.equal(r.modelRatio, null)
  assert.equal(r.trend[0].modelRatio, null)
})

test('stoppedAt names where the drawings stopped and emits every rung', () => {
  const boards = [
    boardFacts(board('p1', dataAtRung('drawn'))),
    boardFacts(board('p2', dataAtRung('drawn'))),
    boardFacts(board('p3', dataAtRung('specified'))),
    boardFacts(board('p4', dataAtRung('linked'))),
  ]
  const r = analyzeAdoption({ boards, impactQueries: [{ projectId: 'p4', ts: 1 }], activity: [] })
  assert.deepEqual(r.stoppedAt, [
    { rung: 'drawn', boards: 2 },
    { rung: 'specified', boards: 1 },
    { rung: 'connected', boards: 0 },
    { rung: 'linked', boards: 0 },
  ])
  assert.equal(r.stoppedAt.some((s) => s.rung === 'queried'), false, 'a model has not stopped')
})

test('queryReadyButUnqueried counts only boards that could have answered', () => {
  const boards = [
    boardFacts(board('p1', dataAtRung('connected'))),
    boardFacts(board('p2', dataAtRung('linked'))),
    boardFacts(board('p3', dataAtRung('drawn'))),
    boardFacts(board('p4', dataAtRung('linked'))),
  ]
  const r = analyzeAdoption({ boards, impactQueries: [{ projectId: 'p4', ts: 1 }], activity: [] })
  assert.equal(r.queryReadyButUnqueried, 2, 'p1 and p2: modelled and never asked. p3 never promised, p4 was asked')
})

test('the trend buckets by creation cohort, monthly by default', () => {
  const boards = [
    boardFacts(board('p1', dataAtRung('drawn'), '2026-01-05T00:00:00.000Z')),
    boardFacts(board('p2', dataAtRung('drawn'), '2026-01-20T00:00:00.000Z')),
    boardFacts(board('p3', dataAtRung('drawn'), '2026-02-02T00:00:00.000Z')),
  ]
  const r = analyzeAdoption({ boards, impactQueries: [{ projectId: 'p2', ts: 1 }], activity: [] })
  assert.deepEqual(
    r.trend.map((c) => [c.bucket, c.boards, c.model, c.drawing, c.modelRatio]),
    [
      ['2026-01', 2, 1, 1, 0.5],
      ['2026-02', 1, 0, 1, 0],
    ],
  )
})

test('the trend can bucket weekly, and buckets sort chronologically', () => {
  const boards = [
    boardFacts(board('p1', dataAtRung('drawn'), '2026-01-05T00:00:00.000Z')),
    boardFacts(board('p2', dataAtRung('drawn'), '2026-03-30T00:00:00.000Z')),
  ]
  const r = analyzeAdoption({ boards, impactQueries: [], activity: [] }, { bucket: 'week' })
  assert.deepEqual(r.trend.map((c) => c.bucket), ['2026-W02', '2026-W14'])
})

test('isoWeek follows the Thursday rule across a year boundary', () => {
  assert.deepEqual(isoWeek(new Date('2027-01-01T00:00:00.000Z')), { year: 2026, week: 53 })
  assert.deepEqual(isoWeek(new Date('2026-01-01T00:00:00.000Z')), { year: 2026, week: 1 })
  assert.equal(bucketKey('2027-01-01T00:00:00.000Z', 'week'), '2026-W53')
})

test('an unparseable createdAt buckets to unknown rather than faking a 1970 cohort', () => {
  assert.equal(bucketKey('not a date', 'month'), 'unknown')
  assert.equal(bucketKey('not a date', 'week'), 'unknown')
})

test('an empty workspace returns a zeroed report, not an error', () => {
  const r = analyzeAdoption({ boards: [], impactQueries: [], activity: [] })
  assert.equal(r.boards, 0)
  assert.equal(r.model, 0)
  assert.equal(r.drawing, 0)
  assert.equal(r.modelRatio, null)
  assert.equal(r.queryReadyButUnqueried, 0)
  assert.deepEqual(r.trend, [])
  assert.deepEqual(r.boardsDetail, [])
  assert.equal(r.stoppedAt.length, RUNGS.length - 2, 'created and queried are structurally empty')
})

test('an impact query with no project attached is ignored, not attributed at random', () => {
  const boards = [boardFacts(board('p1', dataAtRung('drawn')))]
  const r = analyzeAdoption({ boards, impactQueries: [{ projectId: null, ts: 1 } as ImpactQuery], activity: [] })
  assert.equal(r.model, 0)
  assert.equal(r.drawing, 1)
})

test('activity supplies liveness and its absence is null, never zero-as-a-date', () => {
  const spans: ActivitySpan[] = [{ projectId: 'p1', rows: 12, firstTs: 100, lastTs: 900 }]
  const boards = [boardFacts(board('p1', dataAtRung('drawn'))), boardFacts(board('p2', dataAtRung('drawn')))]
  const r = analyzeAdoption({ boards, impactQueries: [], activity: spans })
  const [p1, p2] = r.boardsDetail
  assert.equal(p1.lastActivityAt, 900)
  assert.equal(p1.activityRows, 12)
  assert.equal(p2.lastActivityAt, null)
  assert.equal(p2.activityRows, 0)
})

test('the same rows produce a byte-identical report, and row order does not matter', () => {
  const mk = () => [
    boardFacts(board('p2', dataAtRung('linked'), '2026-02-01T00:00:00.000Z')),
    boardFacts(board('p1', dataAtRung('drawn'), '2026-01-01T00:00:00.000Z')),
    boardFacts(board('p3', dataAtRung('connected'), '2026-02-11T00:00:00.000Z')),
  ]
  const queries: ImpactQuery[] = [
    { projectId: 'p2', ts: 4 },
    { projectId: 'p2', ts: 9 },
  ]
  const a = analyzeAdoption({ boards: mk(), impactQueries: queries, activity: [] })
  const b = analyzeAdoption({ boards: mk().reverse(), impactQueries: [...queries].reverse(), activity: [] })
  assert.equal(JSON.stringify(a), JSON.stringify(b))
  assert.deepEqual(a.boardsDetail.map((d) => d.projectId), ['p1', 'p2', 'p3'])
  assert.equal(a.boardsDetail[1].impactQueries, 2)
  assert.equal(a.boardsDetail[1].lastQueryAt, 9, 'the newest query wins regardless of row order')
})

test('a board that skipped `connected` is NOT query-ready, however deep it got', () => {
  // cm:guard the regression that matters: `queryReady` must read the connectedness predicate, not
  // the ladder depth of `furthest`. This board outranks `connected` and can still answer nothing.
  const d = emptyData()
  d.features.push(feature('f1', { desc: 'means this', codeRefs: [{ path: 'src/x.ts' }] }))
  const facts = boardFacts(board('p', d))
  assert.equal(facts.connected, false)
  assert.deepEqual(rungsOf(facts, false), ['created', 'drawn', 'specified', 'linked'])

  const got = classifyBoard(facts, [])
  assert.equal(got.furthest, 'linked', 'deeper on the ladder than `connected`')
  assert.equal(got.queryReady, false, 'and yet it cannot answer')

  const impact = computeImpact(d, 'f1')
  assert.deepEqual(impact.entryNodes, [], 'the engine agrees: nothing to walk')
  assert.deepEqual(impact.downstream, [])

  const r = analyzeAdoption({ boards: [facts], impactQueries: [], activity: [] })
  assert.equal(r.queryReadyButUnqueried, 0, 'it never promised an answer, so it is not the sharp case')
})

test('the shipped sample template is seeded, not a fully-modelled drawing', () => {
  // cm:guard server/index.ts seeds EVERY new account with sampleTemplate, so without this an
  // account nobody opened reports as a board that was fully modelled and never queried.
  const facts = boardFacts(board('p-sample', templateData('sample')))
  assert.equal(facts.seeded, true)
  assert.ok(facts.nodes > 0 && facts.connected && facts.linked, 'judged on content alone it looks fully modelled')

  const r = analyzeAdoption({ boards: [facts], impactQueries: [], activity: [] })
  assert.equal(r.seeded, 1)
  assert.equal(r.drawing, 0, 'nobody built it, so it is not an abandoned drawing')
  assert.equal(r.queryReadyButUnqueried, 0, 'and it is not modelling that went unused')
  assert.equal(r.modelRatio, null, 'a workspace of untouched templates has no ratio to report')
  assert.deepEqual(r.stoppedAt.map((x) => x.boards), [0, 0, 0, 0], 'it stopped nowhere; it never started')
})

test('the blank template is seeded too, and one edit makes a board somebody work', () => {
  assert.equal(isSeeded(blankTemplate()), true)
  const edited = templateData('sample')
  edited.features.pop()
  assert.equal(isSeeded(edited), false, 'deleting a single node is an edit')
  assert.equal(analyzeAdoption({ boards: [boardFacts(board('p', edited))], impactQueries: [], activity: [] }).drawing, 1)
})

test('seeded detection survives the key reordering a jsonb round-trip performs', () => {
  // cm:why compared by sorted-key fingerprint, not JSON.stringify: Postgres jsonb does not preserve
  // insertion order, so a board read back from the database would otherwise never match a template.
  const reordered = JSON.parse(JSON.stringify(sampleTemplate)) as WorkspaceData
  reordered.features = reordered.features.map((f) => Object.fromEntries(Object.entries(f).reverse()) as Feature)
  assert.equal(isSeeded(reordered), true)
})

test('a seeded board someone actually queried is a model, not a template', () => {
  const facts = boardFacts(board('p', templateData('sample')))
  const r = analyzeAdoption({ boards: [facts], impactQueries: [{ projectId: 'p', ts: 1 }], activity: [] })
  assert.equal(r.model, 1)
  assert.equal(r.seeded, 0)
  assert.equal(r.modelRatio, 1)
})

test('stoppedAt counts drawings only — never empty or seeded boards', () => {
  const boards = [
    boardFacts(board('p1', emptyData())),
    boardFacts(board('p2', emptyData())),
    boardFacts(board('p3', templateData('sample'))),
    boardFacts(board('p4', dataAtRung('drawn'))),
  ]
  const r = analyzeAdoption({ boards, impactQueries: [], activity: [] })
  assert.equal(r.empty, 2)
  assert.equal(r.seeded, 1)
  assert.equal(r.drawing, 1)
  assert.equal(
    r.stoppedAt.reduce((n, x) => n + x.boards, 0),
    r.drawing,
    'the histogram sums to the drawing count and nothing else',
  )
})

test('splitImpactQueries over a project-filtered slice counts only that project', () => {
  // cm:guard the counting slice and the truncation slice are NOT the same rows: the report reads the
  // whole org so `truncated` can fire, and every other number must be narrowed first.
  const orgRows: ToolCallLike[] = [
    { projectId: 'P', tool: 'get_board', outcome: 'ok', ts: 1 },
    { projectId: 'Q', tool: 'compute_impact', outcome: 'ok', ts: 2 },
    { projectId: 'Q', tool: 'compute_impact', outcome: 'error', ts: 3 },
  ]
  const mine = orgRows.filter((c) => c.projectId === 'P')
  const scoped = splitImpactQueries(mine)
  assert.equal(scoped.queries.length, 0, "P was never queried")
  assert.equal(scoped.failed, 0, "and Q's failure is not P's")
  assert.equal(mine.length, 1, 'the scoped window is one call, not the org-wide three')

  const orgWide = splitImpactQueries(orgRows)
  assert.equal(orgWide.queries.length, 1)
  assert.equal(orgWide.failed, 1)
})

test('drawingsBarelyEdited flags a nudged template without reclassifying it', () => {
  const nudged = templateData('sample')
  nudged.swimNodes[0].x += 1
  const boards = [
    boardFacts(board('p-nudged', nudged)),
    boardFacts(board('p-built', dataAtRung('linked'))),
  ]
  const activity: ActivitySpan[] = [
    { projectId: 'p-nudged', rows: 1, firstTs: 10, lastTs: 10 },
    { projectId: 'p-built', rows: 40, firstTs: 10, lastTs: 900 },
  ]
  const r = analyzeAdoption({ boards, impactQueries: [], activity })
  assert.equal(r.drawing, 2, 'one edit breaks the fingerprint, so both are drawings')
  assert.equal(r.drawingsBarelyEdited, 1, 'and the one-edit board is flagged as probably not real work')
  assert.equal(r.queryReadyButUnqueried, 2, 'the verdict itself is unchanged — the hint does not reclassify')
})
