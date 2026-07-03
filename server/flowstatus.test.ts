import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { flowStatusIssues } from '../src/lib/flowstatus'
import type { Feature, SwimNode } from '../src/store/types'

const feature = (id: string, status: Feature['status']): Feature => ({
  id, name: id, status, moduleId: 'm1', releaseId: 'r1',
})
const step = (id: string, flowId: string, status: SwimNode['status']): SwimNode => ({
  id, label: id, lane: 0, flowId, kind: 'process', status, x: 0, y: 0,
})

test('done feature with unfinished flow steps → flow_lags_feature warning', () => {
  const issues = flowStatusIssues([feature('f1', 'done')], [step('a', 'f1', 'done'), step('b', 'f1', 'todo')])
  assert.equal(issues.length, 1)
  assert.equal(issues[0].kind, 'flow_lags_feature')
  assert.ok(issues[0].message.includes('1/2'))
  assert.deepEqual(issues[0].ids, ['f1'])
})

test('all flow steps done but feature not done → feature_lags_flow warning', () => {
  const issues = flowStatusIssues([feature('f1', 'progress')], [step('a', 'f1', 'done'), step('b', 'f1', 'done')])
  assert.equal(issues.length, 1)
  assert.equal(issues[0].kind, 'feature_lags_flow')
})

test('consistent feature+flow (both done, or both in progress) → clean', () => {
  assert.equal(flowStatusIssues([feature('f1', 'done')], [step('a', 'f1', 'done')]).length, 0)
  assert.equal(flowStatusIssues([feature('f1', 'progress')], [step('a', 'f1', 'done'), step('b', 'f1', 'todo')]).length, 0)
})

test('unscoped steps and dangling flowIds are ignored (other rules own them)', () => {
  const unscoped: SwimNode = { ...step('a', 'f1', 'todo'), flowId: undefined }
  assert.equal(flowStatusIssues([feature('f1', 'done')], [unscoped]).length, 0)
  assert.equal(flowStatusIssues([], [step('a', 'ghost', 'todo')]).length, 0)
})
