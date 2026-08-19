import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { deriveOverview } from '../src/lib/overview'
import { deriveAllAlerts } from '../src/lib/impact'
import { templateData } from '../src/shared/seed'

const sample = templateData('sample')

test('deriveOverview rolls up status counts consistently', () => {
  const ov = deriveOverview(sample)
  assert.equal(ov.features.total, sample.features.length)
  assert.equal(ov.features.must + ov.features.progress + ov.features.done + ov.features.nice, ov.features.total)
  assert.equal(ov.steps.total, sample.swimNodes.length)
  assert.equal(ov.steps.todo + ov.steps.progress + ov.steps.done + ov.steps.blocked, ov.steps.total)
})

test('deriveOverview alert counts match deriveAllAlerts', () => {
  const ov = deriveOverview(sample)
  const all = deriveAllAlerts(sample)
  assert.equal(ov.alerts.total, all.length)
  assert.equal(ov.alerts.outdated, all.filter((a) => a.kind === 'outdated').length)
  assert.ok(ov.alerts.outdated >= 1, 'sample seeds a stale node (J)')
  assert.ok(ov.alerts.dod >= 1, 'sample f6 has unmet acceptance criteria')
})

test('deriveOverview surfaces fidelity gaps (pure, pointer-only)', () => {
  const ov = deriveOverview(sample)
  // f6 is committed WITH codeRefs → not a gap; f8 is committed (must) with no codeRefs → a gap.
  const noCode = ov.fidelity.featuresWithoutCode.map((g) => g.id)
  assert.ok(!noCode.includes('f6'))
  assert.ok(noCode.includes('f8'))
  // f6 has unmet acceptance criteria.
  assert.ok(ov.fidelity.unmetAcceptance.some((g) => g.id === 'f6'))
  // Node E is linked via f6's swimlane crossLink → traceable (not a gap); J is stale.
  assert.ok(!ov.fidelity.stepsWithoutFeature.some((g) => g.id === 'E'))
  assert.ok(ov.fidelity.staleNodes.some((g) => g.id === 'J'))
})
