import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  clusterQuestions,
  frictionByTool,
  KEYWORD_TO_FIELD,
  MAX_CHAIN_SCAN,
  MAX_CHAIN_STEPS,
  median,
  rankTools,
  recoveryChains,
  RUN_IDLE_GAP_MS,
  segmentRuns,
  type QuestionLike,
  type ToolCallLike,
} from './toolAnalysis'

const T0 = 1_700_000_000_000
let seq = 0

/** `at` is minutes from the fixture epoch — the readable unit for run boundaries. */
const call = (tool: string, outcome: 'ok' | 'error', at: number, keyId = 'k1', projectId: string | null = 'p1'): ToolCallLike => ({
  id: ++seq,
  ts: T0 + at * 60_000,
  keyId,
  projectId,
  tool,
  params: [],
  outcome,
})

const oneRun = (rows: ToolCallLike[]) => {
  const runs = segmentRuns(rows)
  assert.equal(runs.length, 1, 'fixture is meant to be a single run')
  return runs[0]
}

test("the reporter's create_snapshot example is one chain of length 4", () => {
  const chains = recoveryChains(
    oneRun([
      call('create_snapshot', 'error', 0),
      call('validate_board', 'ok', 1),
      call('update_feature', 'ok', 2),
      call('create_snapshot', 'ok', 3),
    ]),
  )
  assert.equal(chains.length, 1)
  assert.equal(chains[0].tool, 'create_snapshot')
  assert.equal(chains[0].length, 4)
  assert.equal(chains[0].recovered, true)
  assert.deepEqual(
    chains[0].sequence.map((s) => `${s.tool}:${s.outcome}`),
    ['create_snapshot:error', 'validate_board:ok', 'update_feature:ok', 'create_snapshot:ok'],
  )
})

test('a chain counts calls to EVERY tool, not just the failing one', () => {
  const chains = recoveryChains(
    oneRun([call('add_swim_edge', 'error', 0), call('get_board', 'ok', 1), call('add_swim_node', 'ok', 2), call('add_swim_edge', 'ok', 3)]),
  )
  assert.equal(chains[0].length, 4)
})

test('a failure the run never recovers from ends at the run’s last call', () => {
  const chains = recoveryChains(oneRun([call('create_snapshot', 'error', 0), call('validate_board', 'ok', 1)]))
  assert.equal(chains.length, 1)
  assert.equal(chains[0].length, 2)
  assert.equal(chains[0].recovered, false)
})

test('a lone failed call is a chain of length 1', () => {
  const chains = recoveryChains(oneRun([call('create_snapshot', 'error', 0)]))
  assert.deepEqual(
    chains.map((c) => [c.length, c.recovered]),
    [[1, false]],
  )
})

test('two failures before one success open two overlapping chains', () => {
  const chains = recoveryChains(
    oneRun([
      call('create_snapshot', 'error', 0),
      call('create_snapshot', 'error', 1),
      call('validate_board', 'ok', 2),
      call('create_snapshot', 'ok', 3),
    ]),
  )
  assert.deepEqual(
    chains.map((c) => c.length),
    [4, 3],
  )
})

test('a success by another tool does not close the chain', () => {
  const chains = recoveryChains(oneRun([call('create_snapshot', 'error', 0), call('validate_board', 'ok', 1)]))
  assert.equal(chains[0].recovered, false, 'only a success of the SAME tool counts as recovery')
})

test('an idle gap longer than the threshold splits the run; a shorter one does not', () => {
  assert.equal(segmentRuns([call('a', 'ok', 0), call('b', 'ok', 9)]).length, 1)
  assert.equal(segmentRuns([call('a', 'ok', 0), call('b', 'ok', 11)]).length, 2)
  assert.equal(RUN_IDLE_GAP_MS, 10 * 60 * 1000)
})

test('a chain never spans a run boundary', () => {
  const runs = segmentRuns([call('create_snapshot', 'error', 0), call('create_snapshot', 'ok', 30)])
  assert.equal(runs.length, 2)
  assert.equal(recoveryChains(runs[0])[0].recovered, false)
})

test('another actor’s calls never join a run', () => {
  const runs = segmentRuns([call('create_snapshot', 'error', 0, 'k1'), call('create_snapshot', 'ok', 1, 'k2')])
  assert.equal(runs.length, 2)
  assert.equal(recoveryChains(runs[0])[0].recovered, false, 'k2 succeeding did not rescue k1')
})

// cm:why one key working on two projects is ONE run: projectId is optional on 52 of 67 tools and the
// server fills the default, so a run keyed on it splits mid-session and its chains never close.
test('one key is one run regardless of which project each call named', () => {
  const runs = segmentRuns([call('a', 'ok', 0, 'k1', 'p1'), call('a', 'ok', 1, 'k1', 'p2')])
  assert.equal(runs.length, 1)
  assert.deepEqual(runs[0].calls.map((c) => c.projectId), ['p1', 'p2'], 'the row keeps its project — only the RUN key drops it')
})

test('a failure recorded without a project is recovered by the same call that named one', () => {
  const runs = segmentRuns([call('create_snapshot', 'error', 0, 'k1', null), call('create_snapshot', 'ok', 1, 'k1', 'p1')])
  assert.equal(runs.length, 1)
  const chains = recoveryChains(runs[0])
  assert.deepEqual(
    chains.map((c) => [c.length, c.recovered]),
    [[2, true]],
    'a null/p1 split would have scored this unrecovered, running to the end of the null group',
  )
})

test('two keys on the same project stay two runs', () => {
  assert.equal(segmentRuns([call('a', 'ok', 0, 'k1', 'p1'), call('a', 'ok', 1, 'k2', 'p1')]).length, 2)
})

test('a chain is capped, and says so, instead of walking the rest of the run', () => {
  const rows: ToolCallLike[] = [call('create_snapshot', 'error', 0)]
  for (let i = 1; i <= MAX_CHAIN_SCAN + 50; i++) rows.push(call('get_board', 'ok', i * 0.01))
  const chains = recoveryChains(oneRun(rows))
  assert.equal(chains.length, 1)
  assert.equal(chains[0].length, MAX_CHAIN_SCAN, 'the length is the cap, i.e. a lower bound')
  assert.equal(chains[0].recovered, false)
  assert.equal(chains[0].capped, true)
  assert.equal(chains[0].sequence.length, MAX_CHAIN_STEPS, 'and only the readable head is quoted')
  assert.equal(chains[0].omittedSteps, MAX_CHAIN_SCAN - MAX_CHAIN_STEPS)
})

test('a chain that ends before the cap is not flagged as capped', () => {
  const chains = recoveryChains(oneRun([call('create_snapshot', 'error', 0), call('create_snapshot', 'ok', 1)]))
  assert.equal(chains[0].capped, false)
  assert.equal(chains[0].omittedSteps, 0)
})

test('the response stays bounded on a run that is one long failure', () => {
  const rows: ToolCallLike[] = []
  for (let i = 0; i < 4000; i++) rows.push(call('add_swim_edge', 'error', i * 0.01))
  const { ranking, topChains } = rankTools(rows)
  assert.equal(ranking[0].failures, 4000, 'every failure is still counted')
  assert.equal(topChains.length, 3, 'but at most CHAINS_PER_TOOL sequences are quoted')
  for (const c of topChains) assert.ok(c.sequence.length <= MAX_CHAIN_STEPS)
  assert.ok(JSON.stringify(topChains).length < 20_000, 'a 4000-call run must not return a megabyte of sequences')
})

test('median averages the two middles on an even count', () => {
  assert.equal(median([1, 2, 3, 4]), 2.5)
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([]), 0)
})

// cm:why the expected ranking below is computed BY HAND from this run, not captured from output:
// a snapshot of what the code already does could not have caught a wrong chain definition.
const RANKING_FIXTURE = (): ToolCallLike[] => {
  seq = 0
  return [
    call('create_snapshot', 'error', 0),
    call('validate_board', 'ok', 1),
    call('update_feature', 'ok', 2),
    call('create_snapshot', 'ok', 3),
    call('add_swim_node', 'error', 4),
    call('add_swim_node', 'ok', 5),
    call('add_swim_edge', 'error', 6),
    call('get_board', 'ok', 7),
    call('add_swim_node', 'ok', 8),
    call('add_swim_edge', 'ok', 9),
    call('create_snapshot', 'error', 10),
    call('validate_board', 'ok', 11),
    call('create_snapshot', 'ok', 12),
    call('search', 'ok', 13),
    call('get_board', 'ok', 14),
    call('update_feature', 'error', 15),
    call('update_feature', 'ok', 16),
    call('search', 'ok', 17),
    call('validate_board', 'ok', 18),
    call('next_action', 'ok', 19),
  ]
}

test('the ranking equals the hand-computed expectation, worst-first', () => {
  const { ranking, runs, calls } = rankTools(RANKING_FIXTURE())
  assert.equal(runs, 1)
  assert.equal(calls, 20)
  assert.deepEqual(ranking, [
    { tool: 'add_swim_edge', calls: 2, failures: 1, medianChainLength: 4, maxChainLength: 4, unrecovered: 0 },
    { tool: 'create_snapshot', calls: 4, failures: 2, medianChainLength: 3.5, maxChainLength: 4, unrecovered: 0 },
    { tool: 'add_swim_node', calls: 3, failures: 1, medianChainLength: 2, maxChainLength: 2, unrecovered: 0 },
    { tool: 'update_feature', calls: 3, failures: 1, medianChainLength: 2, maxChainLength: 2, unrecovered: 0 },
    { tool: 'get_board', calls: 2, failures: 0, medianChainLength: 0, maxChainLength: 0, unrecovered: 0 },
    { tool: 'next_action', calls: 1, failures: 0, medianChainLength: 0, maxChainLength: 0, unrecovered: 0 },
    { tool: 'search', calls: 2, failures: 0, medianChainLength: 0, maxChainLength: 0, unrecovered: 0 },
    { tool: 'validate_board', calls: 3, failures: 0, medianChainLength: 0, maxChainLength: 0, unrecovered: 0 },
  ])
})

test('a tool that never failed still appears, with a median of 0', () => {
  const { ranking } = rankTools(RANKING_FIXTURE())
  const vb = ranking.find((r) => r.tool === 'validate_board')
  assert.equal(vb?.calls, 3)
  assert.equal(vb?.medianChainLength, 0)
})

test('top chains quote the literal sequences of the worst offenders only', () => {
  const { topChains } = rankTools(RANKING_FIXTURE())
  assert.deepEqual(
    topChains.map((c) => [c.tool, c.length]),
    [
      ['add_swim_edge', 4],
      ['create_snapshot', 4],
      ['create_snapshot', 3],
      ['add_swim_node', 2],
      ['update_feature', 2],
    ],
  )
  assert.deepEqual(
    topChains[0].sequence.map((s) => s.tool),
    ['add_swim_edge', 'get_board', 'add_swim_node', 'add_swim_edge'],
  )
})

test('topN bounds how many offenders get their sequences quoted', () => {
  assert.deepEqual(
    rankTools(RANKING_FIXTURE(), 1).topChains.map((c) => c.tool),
    ['add_swim_edge'],
  )
})

test('the same rows give a deep-equal answer on re-run', () => {
  assert.deepEqual(rankTools(RANKING_FIXTURE()), rankTools(RANKING_FIXTURE()))
})

test('row order in the table does not change the answer', () => {
  const forward = RANKING_FIXTURE()
  const shuffled = [...RANKING_FIXTURE()].reverse()
  assert.deepEqual(rankTools(shuffled), rankTools(forward))
})

test('an empty table yields an empty ranking, not a crash', () => {
  assert.deepEqual(rankTools([]), { ranking: [], topChains: [], runs: 0, calls: 0 })
})

const q = (id: string, text: string): QuestionLike => ({ id, kind: 'question', text, tool: null })

test('three phrasings of the same question land in one cluster', () => {
  const clusters = clusterQuestions([
    q('q1', 'Who owns this feature?'),
    q('q2', 'Who is the owner of the checkout flow?'),
    q('q3', 'Who should be assigned this step?'),
  ])
  assert.equal(clusters.length, 1)
  assert.equal(clusters[0].count, 3)
  assert.equal(clusters[0].missingField, 'feature.owner')
  assert.equal(clusters[0].fieldStatus, 'missing', 'no board entity carries a feature owner')
  assert.equal(clusters[0].representatives.length, 3)
})

test('a cluster the lexicon does not recognise reports null, not a guess', () => {
  const clusters = clusterQuestions([q('q1', 'Should the generated migration use tabs or spaces?')])
  assert.equal(clusters.length, 1)
  assert.equal(clusters[0].missingField, null)
  assert.equal(clusters[0].fieldStatus, null)
})

test('a question about a field that DOES exist is reported as present, not a schema gap', () => {
  const clusters = clusterQuestions([
    q('q1', 'What are the acceptance criteria for this feature?'),
    q('q2', 'Which acceptance criteria count as done here?'),
  ])
  assert.equal(clusters[0].count, 2)
  assert.equal(clusters[0].fieldStatus, 'present')
  assert.ok(clusters[0].missingField?.includes('set_acceptance'))
})

test('clusters are ordered by count, biggest first', () => {
  const clusters = clusterQuestions([
    q('q1', 'Who owns this feature?'),
    q('q2', 'Who is assigned the checkout flow?'),
    q('q3', 'When is this due?'),
  ])
  assert.deepEqual(
    clusters.map((c) => [c.signature, c.count]),
    [
      ['feature.owner', 2],
      ['feature.dueDate', 1],
    ],
  )
})

test('friction reports are not clustered as questions', () => {
  const rows: QuestionLike[] = [
    { id: 'fr1', kind: 'friction', text: 'Wanted: ten steps in one call', tool: 'add_swim_node' },
    q('q1', 'Who owns this feature?'),
  ]
  const clusters = clusterQuestions(rows)
  assert.equal(clusters.length, 1)
  assert.equal(clusters[0].signature, 'feature.owner')
})

test('clustering is deterministic over the same corpus', () => {
  const rows = [q('q1', 'Who owns this?'), q('q2', 'When is it due?'), q('q3', 'Should we use tabs?')]
  assert.deepEqual(clusterQuestions(rows), clusterQuestions(rows))
})

test('an empty corpus clusters to nothing', () => {
  assert.deepEqual(clusterQuestions([]), [])
})

test('no lexicon keyword is silently swallowed by the stopword list', () => {
  for (const entry of KEYWORD_TO_FIELD) {
    for (const keyword of entry.keywords) {
      assert.ok(keyword.length >= 3, `"${keyword}" is shorter than the token filter allows`)
      const clusters = clusterQuestions([q('q1', `${keyword} placeholder question`)])
      assert.equal(clusters[0].missingField, entry.field, `keyword "${keyword}" never reaches ${entry.field}`)
    }
  }
})

test('two questions sharing an alert id are two questions, not one overwriting the other', () => {
  const clusters = clusterQuestions([q('q1', 'Who owns this feature?'), q('q1', 'When is this due?')])
  assert.deepEqual(
    clusters.map((c) => [c.signature, c.count]),
    [
      ['feature.dueDate', 1],
      ['feature.owner', 1],
    ],
  )
})

test('friction reports are counted per tool, worst-first', () => {
  const rows: QuestionLike[] = [
    { id: 'fr1', kind: 'friction', text: 'x', tool: 'add_swim_node' },
    { id: 'fr2', kind: 'friction', text: 'y', tool: 'add_swim_node' },
    { id: 'fr3', kind: 'friction', text: 'z', tool: 'bulk_apply' },
    { id: 'fr4', kind: 'friction', text: 'w', tool: null },
    q('q1', 'Who owns this?'),
  ]
  assert.deepEqual(frictionByTool(rows), [
    { tool: 'add_swim_node', count: 2 },
    { tool: 'bulk_apply', count: 1 },
    { tool: 'unnamed', count: 1 },
  ])
})

test('a corpus with no friction reports counts nothing', () => {
  assert.deepEqual(frictionByTool([q('q1', 'Who owns this?')]), [])
})
