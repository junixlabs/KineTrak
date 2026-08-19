import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { applyCommand, type Command, type Root } from '../src/shared/board'
import { archivedQuestion } from './questionLog'
import { clusterQuestions, type QuestionLike } from './toolAnalysis'
import type { WorkspaceData } from '../src/store/types'

const NOW = 1_700_000_000_000

const root = (): Root => ({
  orgs: [{ id: 'o1', name: 'Org' }],
  projects: [
    {
      id: 'p1',
      orgId: 'o1',
      name: 'Proj',
      createdAt: '2026-01-01',
      snapshots: [],
      data: { modules: [], features: [], releases: [], lanes: [], swimNodes: [], swimEdges: [], alerts: [] } as WorkspaceData,
    },
  ],
})

const ask: Command = { type: 'askHuman', projectId: 'p1', id: 'q1', question: 'Who owns the checkout flow?', options: ['Ana', 'Bo'] }
const friction: Command = {
  type: 'reportFriction',
  projectId: 'p1',
  id: 'fr1',
  tool: 'add_swim_node',
  wanted: 'create ten steps in one call',
  tried: 'ten sequential calls',
  received: 'each call re-arranged the lane',
  workaround: 'called arrange_swimlane once at the end',
  params: ['flowId', 'lane'],
}

test('an ask_human question is archived with its text and options', () => {
  const row = archivedQuestion(ask, NOW)
  assert.equal(row?.id, 'q1')
  assert.equal(row?.kind, 'question')
  assert.equal(row?.projectId, 'p1')
  assert.equal(row?.askedAt, NOW)
  assert.ok(row?.text.includes('Who owns the checkout flow?'))
  assert.ok(row?.text.includes('Ana / Bo'), 'the options are part of what was asked')
  assert.equal(row?.tool, null)
})

test('a friction report is archived with all four fields and the tool it names', () => {
  const row = archivedQuestion(friction, NOW)
  assert.equal(row?.kind, 'friction')
  assert.equal(row?.tool, 'add_swim_node')
  for (const value of ['create ten steps in one call', 'ten sequential calls', 'each call re-arranged the lane', 'called arrange_swimlane once at the end']) {
    assert.ok(row?.text.includes(value), `the archive must carry "${value}" — the corpus is the point`)
  }
})

test('dismissing the alert destroys the board alert and nothing else', () => {
  const archived = archivedQuestion(friction, NOW)
  const withAlert = applyCommand(root(), friction)
  assert.equal(withAlert.projects[0].data.alerts.length, 1)

  const dismissed = applyCommand(withAlert, { type: 'resolveQuestion', projectId: 'p1', id: 'fr1' })
  assert.deepEqual(dismissed.projects[0].data.alerts, [], 'the reducer still deletes outright — unchanged')
  assert.ok(archived?.text.includes('called arrange_swimlane once at the end'), 'the archive predates the dismissal and survives it')
})

test('commands that raise no alert archive nothing', () => {
  for (const cmd of [
    { type: 'resolveQuestion', projectId: 'p1', id: 'q1' },
    { type: 'addModule', projectId: 'p1', id: 'm1', name: 'Checkout' },
  ] as Command[]) {
    assert.equal(archivedQuestion(cmd, NOW), null)
  }
})

test('an archived question reaches the clustering the analysis runs', () => {
  const rows = [ask, { ...ask, id: 'q2', question: 'Who is assigned this step?' } as Command]
    .map((c) => archivedQuestion(c, NOW))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r): QuestionLike => ({ id: r.id, kind: r.kind, text: r.text }))
  const clusters = clusterQuestions(rows)
  assert.equal(clusters.length, 1)
  assert.equal(clusters[0].count, 2)
  assert.equal(clusters[0].missingField, 'feature.owner')
})
