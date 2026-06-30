import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { computeImpact, deriveImpactAlerts } from '../src/lib/impact'
import { templateData } from '../src/store/seed'

// The sample board: f6 "Automatic impact calculation" links to swim node E
// (E→F,E→G,F→H,H→I,I→J,G→J,J→K), f8 links to J (J→K).
const sample = templateData('sample')

test('computeImpact from a feature resolves its swimlane entry + downstream', () => {
  const imp = computeImpact(sample, 'f6')
  assert.deepEqual(imp.entryNodes, ['E'])
  // everything reachable from E except E itself
  assert.deepEqual(imp.downstream, ['F', 'G', 'H', 'I', 'J', 'K'])
  assert.ok(imp.affectedLanes.length >= 2, 'spans multiple lanes')
})

test('computeImpact from a swim-node id works directly', () => {
  const imp = computeImpact(sample, 'J')
  assert.deepEqual(imp.entryNodes, ['J'])
  assert.deepEqual(imp.downstream, ['K'])
})

test('computeImpact is empty for a feature with no swimlane link', () => {
  const imp = computeImpact(sample, 'f1') // Node customization — no crossLinks
  assert.deepEqual(imp.entryNodes, [])
  assert.deepEqual(imp.downstream, [])
})

test('deriveImpactAlerts flags only committed features above the threshold', () => {
  const alerts = deriveImpactAlerts(sample, 3)
  // f6 (progress, 6 downstream) qualifies; f8 (must, only K downstream) does not.
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].id, 'impact:f6')
  assert.equal(alerts[0].kind, 'impact')
  assert.equal(alerts[0].action.selection?.id, 'E', 'action navigates to the entry node')
})

test('a high threshold suppresses all impact alerts', () => {
  assert.equal(deriveImpactAlerts(sample, 100).length, 0)
})

test('marking the feature done clears its impact alert (derived, not stored)', () => {
  const done = structuredClone(sample)
  done.features = done.features.map((f) => (f.id === 'f6' ? { ...f, status: 'done' as const } : f))
  assert.equal(deriveImpactAlerts(done, 3).length, 0)
})

test('deriveImpactAlerts is deterministic (stable order + ids)', () => {
  const a = deriveImpactAlerts(sample, 1).map((x) => x.id)
  const b = deriveImpactAlerts(sample, 1).map((x) => x.id)
  assert.deepEqual(a, b)
  assert.deepEqual(a, [...a].sort())
})
