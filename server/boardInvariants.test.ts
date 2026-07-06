import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { boardQualityIssues, severityFor, OVERLAP_PX } from '../src/shared/boardInvariants'
import type { WorkspaceData, Feature, SwimNode, SwimEdge, BoardRole } from '../src/store/types'

const feature = (id: string, status: Feature['status'] = 'progress', extra: Partial<Feature> = {}): Feature => ({
  id, name: id, status, moduleId: 'm1', releaseId: 'r1', ...extra,
})
const step = (id: string, opts: Partial<SwimNode> = {}): SwimNode => ({
  id, label: id, lane: 0, kind: 'process', status: 'todo', x: 0, y: 0, ...opts,
})

const board = (over: Partial<WorkspaceData> = {}, role?: BoardRole): WorkspaceData => ({
  modules: [], features: [], releases: [], lanes: [], swimNodes: [], swimEdges: [], alerts: [],
  settings: role ? { boardRole: role } : undefined,
  ...over,
})

const kinds = (data: WorkspaceData) => boardQualityIssues(data).map((i) => i.kind)

test('I1 unscoped_step — a node with no flowId is flagged', () => {
  const data = board({ swimNodes: [step('a')] })
  assert.deepEqual(kinds(data), ['unscoped_step'])
})

test('I1 — a scoped node is clean', () => {
  const data = board({ features: [feature('f1')], swimNodes: [step('a', { flowId: 'f1', kind: 'start', x: 0 }), step('b', { flowId: 'f1', kind: 'end', x: 220 })], swimEdges: [{ from: 'a', to: 'b' }] })
  assert.deepEqual(kinds(data), [])
})

test('I2 overlapping_steps — two nodes stacked in the same lane', () => {
  const nodes = [step('a', { flowId: 'f1', x: 100, y: 100 }), step('b', { flowId: 'f1', x: 100 + OVERLAP_PX - 5, y: 100 })]
  const data = board({ features: [feature('f1')], swimNodes: nodes })
  assert.ok(kinds(data).includes('overlapping_steps'))
})

test('I2 — nodes far apart, or in different lanes, do not overlap', () => {
  const nodes = [step('a', { flowId: 'f1', x: 100, y: 100 }), step('b', { flowId: 'f1', x: 100 + OVERLAP_PX + 1, y: 100 }), step('c', { flowId: 'f1', lane: 1, x: 100, y: 100 })]
  const data = board({ features: [feature('f1')], swimNodes: nodes })
  assert.ok(!kinds(data).includes('overlapping_steps'))
})

test('I4 cross_flow_edge — an edge between two flows', () => {
  const nodes = [step('a', { flowId: 'f1' }), step('b', { flowId: 'f2' })]
  const edges: SwimEdge[] = [{ from: 'a', to: 'b' }]
  const data = board({ features: [feature('f1'), feature('f2')], swimNodes: nodes, swimEdges: edges })
  assert.ok(kinds(data).includes('cross_flow_edge'))
})

test('I5 decision_no_branches — a decision with <2 outgoing edges', () => {
  const nodes = [step('d', { flowId: 'f1', kind: 'decision' }), step('x', { flowId: 'f1' })]
  const data = board({ features: [feature('f1')], swimNodes: nodes, swimEdges: [{ from: 'd', to: 'x' }] })
  assert.ok(kinds(data).includes('decision_no_branches'))
})

test('I5 — a decision that forks is clean', () => {
  const nodes = [step('d', { flowId: 'f1', kind: 'decision' }), step('x', { flowId: 'f1' }), step('y', { flowId: 'f1' })]
  const edges: SwimEdge[] = [{ from: 'd', to: 'x', branch: 'yes' }, { from: 'd', to: 'y', branch: 'no' }]
  const data = board({ features: [feature('f1')], swimNodes: nodes, swimEdges: edges })
  assert.ok(!kinds(data).includes('decision_no_branches'))
})

test('I6 flow_no_start / flow_no_end — a flow missing its endpoints', () => {
  const data = board({ features: [feature('f1')], swimNodes: [step('a', { flowId: 'f1', kind: 'process' })] })
  const k = kinds(data)
  assert.ok(k.includes('flow_no_start'))
  assert.ok(k.includes('flow_no_end'))
})

test('I7 done_without_acceptance — only on ssot boards', () => {
  const feat = feature('f1', 'done')
  const nodes = [step('a', { flowId: 'f1', kind: 'start' }), step('b', { flowId: 'f1', kind: 'end' })]
  const edges: SwimEdge[] = [{ from: 'a', to: 'b' }]
  // map board: silent
  assert.ok(!kinds(board({ features: [feat], swimNodes: nodes, swimEdges: edges }, 'map')).includes('done_without_acceptance'))
  // ssot board: flagged
  assert.ok(kinds(board({ features: [feat], swimNodes: nodes, swimEdges: edges }, 'ssot')).includes('done_without_acceptance'))
})

test('I7 — done feature with all criteria checked is clean on ssot', () => {
  const feat = feature('f1', 'done', { validations: ['x', 'y'], validationsDone: ['x', 'y'] })
  const nodes = [step('a', { flowId: 'f1', kind: 'start' }), step('b', { flowId: 'f1', kind: 'end' })]
  const data = board({ features: [feat], swimNodes: nodes, swimEdges: [{ from: 'a', to: 'b' }] }, 'ssot')
  assert.ok(!kinds(data).includes('done_without_acceptance'))
})

test('I10 flow_feature_mismatch — flowId disagrees with the linked feature', () => {
  const node = step('a', { flowId: 'f1', kind: 'start', crossLinks: [{ view: 'mindmap', label: 'x', targetId: 'f2' }] })
  const end = step('b', { flowId: 'f1', kind: 'end' })
  const data = board({ features: [feature('f1'), feature('f2')], swimNodes: [node, end], swimEdges: [{ from: 'a', to: 'b' }] })
  assert.ok(kinds(data).includes('flow_feature_mismatch'))
})

test('severityFor — ssot escalates structural invariants to error, map keeps warning', () => {
  assert.equal(severityFor('unscoped_step', 'ssot'), 'error')
  assert.equal(severityFor('overlapping_steps', 'ssot'), 'error')
  assert.equal(severityFor('unscoped_step', 'map'), 'warning')
  assert.equal(severityFor('unscoped_step', 'asis-doc'), 'warning')
  assert.equal(severityFor('unscoped_step', undefined), 'warning')
  // DoD + mismatch stay advisory even on ssot
  assert.equal(severityFor('done_without_acceptance', 'ssot'), 'warning')
  assert.equal(severityFor('flow_feature_mismatch', 'ssot'), 'warning')
})
