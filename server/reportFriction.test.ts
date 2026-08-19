import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { applyCommand, type Root } from '../src/shared/board'
import { describeCommand } from './activity'
import { deriveAllAlerts, hasAlertTarget, isDismissibleAlertKind } from '../src/lib/impact'
import type { Alert, WorkspaceData } from '../src/shared/types'

const emptyData = (alerts: Alert[] = []): WorkspaceData => ({
  modules: [], features: [], releases: [], lanes: [], swimNodes: [], swimEdges: [], alerts,
})

const root = (alerts: Alert[] = []): Root => ({
  orgs: [{ id: 'o1', name: 'Org' }],
  projects: [{ id: 'p1', orgId: 'o1', name: 'Proj', createdAt: '2026-01-01', snapshots: [], data: emptyData(alerts) }],
})

const cmd = {
  type: 'reportFriction' as const,
  projectId: 'p1',
  id: 'fr1',
  tool: 'add_swim_node',
  wanted: 'create ten steps in one call',
  tried: 'ten sequential calls',
  received: 'each call re-arranged the lane',
  workaround: 'called arrange_swimlane once at the end',
  params: ['flowId', 'lane'],
}

const alertsOf = (r: Root) => r.projects[0].data.alerts

test('reportFriction appends one friction alert carrying all four fields', () => {
  const out = applyCommand(root(), cmd)
  const list = alertsOf(out)
  assert.equal(list.length, 1)
  const a = list[0]
  assert.equal(a.kind, 'friction')
  assert.equal(a.id, 'fr1')
  assert.ok(a.title.includes('add_swim_node'), 'title names the tool')
  for (const v of [cmd.wanted, cmd.tried, cmd.received, cmd.workaround]) {
    assert.ok(a.detail.includes(v), `detail carries "${v}"`)
  }
  assert.ok(a.detail.includes('flowId, lane'), 'detail carries the parameter names')
  assert.deepEqual(a.tags, ['@tooling'])
})

test('a friction alert is a report, not a pending decision', () => {
  const a = alertsOf(applyCommand(root(), cmd))[0]
  assert.notEqual(a.time, 'pending')
  assert.equal(a.time, 'reported')
  assert.equal(a.options, undefined)
  assert.equal(a.answer, undefined)
})

test('resolveQuestion dismisses a friction alert and leaves others untouched', () => {
  const other: Alert = {
    id: 'q1', kind: 'question', title: 'Needs a decision', detail: 'x', tags: ['@human'],
    time: 'pending', actionLabel: 'Review', action: { view: 'swimlane', selection: null },
  }
  const reported = applyCommand(root([other]), cmd)
  assert.equal(alertsOf(reported).length, 2)
  const after = applyCommand(reported, { type: 'resolveQuestion', projectId: 'p1', id: 'fr1' })
  assert.deepEqual(alertsOf(after).map((a) => a.id), ['q1'])
})

test('the activity summary for reportFriction names the tool and the workaround', () => {
  const { summary } = describeCommand(cmd)
  assert.ok(summary.length > 0, 'summary is not blank')
  assert.ok(summary.includes('add_swim_node'), 'summary names the tool')
  assert.ok(summary.includes('arrange_swimlane'), 'summary carries the workaround')
})

test('only a friction report is dismissible from the UI', () => {
  assert.equal(isDismissibleAlertKind('friction'), true)
  for (const kind of ['question', 'impact', 'outdated', 'dod'] as const) {
    assert.equal(isDismissibleAlertKind(kind), false, `${kind} must not be dismissible`)
  }
})

test('deriveAllAlerts surfaces a stored friction alert', () => {
  const stored = alertsOf(applyCommand(root(), cmd))
  const derived = deriveAllAlerts(emptyData(stored))
  assert.deepEqual(derived.map((a) => a.id), ['fr1'], 'the friction kind is not swallowed as derived')
})

test('a friction report with no nodeId offers no navigation target', () => {
  const a = alertsOf(applyCommand(root(), cmd))[0]
  assert.equal(hasAlertTarget(a), false)
  assert.equal(a.actionLabel, '')
  const onNode = alertsOf(applyCommand(root(), { ...cmd, nodeId: 'n1' }))[0]
  assert.equal(hasAlertTarget(onNode), true)
  assert.equal(onNode.actionLabel, 'Open step')
})

test('dismissing an alert is not logged as resolving a decision', () => {
  const { summary } = describeCommand({ type: 'resolveQuestion', projectId: 'p1', id: 'fr1' })
  assert.ok(summary.length > 0, 'summary is not blank')
  assert.ok(!/decision/i.test(summary), `"${summary}" must not call a friction dismissal a decision`)
})

test('the four report fields render as separate lines, not one run-on string', () => {
  const a = alertsOf(applyCommand(root(), cmd))[0]
  assert.equal(a.detail.split('\n').length, 4)
})
