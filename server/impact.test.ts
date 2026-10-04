import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { computeImpact, deriveImpactAlerts, deriveOutdatedAlerts, deriveDodAlerts, dependentsOf } from '../src/lib/impact'
import { templateData } from '../src/shared/seed'
import { applyCommand, type Root } from '../src/shared/board'

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
  const action = alerts[0].action
  assert.ok('selection' in action && action.selection?.id === 'E', 'action navigates to the entry node')
})

test('a high threshold suppresses all swimlane-footprint impact alerts', () => {
  // declared dependents raise an alert at any threshold (by design), so the threshold is read on a
  // copy of the Sample without its dependencies
  const noDeps = { ...sample, features: sample.features.map((f) => ({ ...f, dependsOn: [] })) }
  assert.equal(deriveImpactAlerts(noDeps, 100).length, 0)
  assert.deepEqual(deriveImpactAlerts(sample, 100).map((a) => a.id), ['impact:f6'], 'f8 depends on f6')
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

// ── P0: crossLinks are writable end-to-end, so impact works on a built board ──
test('linkFeatureStep populates crossLinks so compute_impact resolves an agent-built feature', () => {
  const PID = 'p1'
  let root: Root = { orgs: [], projects: [{ id: PID, orgId: 'o1', name: 'p', createdAt: 'x', data: templateData('blank'), snapshots: [] }] }
  // Build a tiny flow: two steps in lane 0, an edge S1→S2, and a feature.
  root = applyCommand(root, { type: 'addSwimNode', projectId: PID, id: 'S1', code: 'A', lane: 0, x: 0, y: 0 })
  root = applyCommand(root, { type: 'addSwimNode', projectId: PID, id: 'S2', code: 'B', lane: 0, x: 0, y: 0 })
  root = applyCommand(root, { type: 'addSwimEdge', projectId: PID, from: 'S1', to: 'S2' })
  root = applyCommand(root, { type: 'addModule', projectId: PID, id: 'M1' })
  root = applyCommand(root, { type: 'addFeature', projectId: PID, id: 'F1', moduleId: 'M1', releaseId: 'mvp' })

  const before = computeImpact(root.projects[0].data, 'F1')
  assert.deepEqual(before.entryNodes, [], 'no link yet → impact engine sees nothing (the old bug)')

  root = applyCommand(root, { type: 'linkFeatureStep', projectId: PID, featureId: 'F1', nodeId: 'S1', op: 'link' })
  const after = computeImpact(root.projects[0].data, 'F1')
  assert.deepEqual(after.entryNodes, ['S1'], 'feature now resolves to its swimlane entry node')
  assert.deepEqual(after.downstream, ['S2'], 'downstream reachability follows the edge')

  // Unlink is idempotent + reversible.
  root = applyCommand(root, { type: 'linkFeatureStep', projectId: PID, featureId: 'F1', nodeId: 'S1', op: 'unlink' })
  assert.deepEqual(computeImpact(root.projects[0].data, 'F1').entryNodes, [])
})

// ── Dependency-aware impact ───────────────────────────────────────────────────
test('setDependency makes changing a feature ripple to its transitive dependents', () => {
  const PID = 'p1'
  let root: Root = { orgs: [], projects: [{ id: PID, orgId: 'o1', name: 'p', createdAt: 'x', data: templateData('blank'), snapshots: [] }] }
  root = applyCommand(root, { type: 'addModule', projectId: PID, id: 'M1' })
  for (const id of ['A', 'B', 'C']) root = applyCommand(root, { type: 'addFeature', projectId: PID, id, moduleId: 'M1', releaseId: 'mvp' })
  // C depends on B, B depends on A ⇒ dependents(A) = {B, C}
  root = applyCommand(root, { type: 'setDependency', projectId: PID, featureId: 'B', dependsOnId: 'A', op: 'add' })
  root = applyCommand(root, { type: 'setDependency', projectId: PID, featureId: 'C', dependsOnId: 'B', op: 'add' })
  const d = root.projects[0].data
  assert.deepEqual([...dependentsOf(d, 'A')].sort(), ['B', 'C'])
  const imp = computeImpact(d, 'A')
  assert.deepEqual(imp.affectedFeatures, ['B', 'C'])
  assert.deepEqual(imp.affectedModules, ['M1'])
})

test('deriveOutdatedAlerts fires only for codeStale nodes and clears when re-linked', () => {
  // Sample seeds node J as codeStale (a webhook flagged src/shared/board.ts).
  const out = deriveOutdatedAlerts(sample)
  assert.ok(out.some((a) => a.id === 'outdated:J'), 'stale step raises an outdated alert')
  // Re-linking code reconciles → clears the flag → no alert.
  let root: Root = { orgs: [], projects: [{ id: 'p1', orgId: 'o1', name: 'p', createdAt: 'x', data: structuredClone(sample), snapshots: [] }] }
  root = applyCommand(root, { type: 'linkCode', projectId: 'p1', target: 'swimnode', id: 'J', ref: { path: 'src/shared/board.ts' }, op: 'link' })
  assert.equal(deriveOutdatedAlerts(root.projects[0].data).some((a) => a.id === 'outdated:J'), false)
})

test('deriveDodAlerts flags committed features with unmet acceptance criteria', () => {
  // f6 (progress) has 3 criteria, 1 done ⇒ a DoD alert.
  const dod = deriveDodAlerts(sample)
  assert.ok(dod.some((a) => a.id === 'dod:f6'), 'unmet acceptance criteria block done')
  // Checking them all off clears it.
  let root: Root = { orgs: [], projects: [{ id: 'p1', orgId: 'o1', name: 'p', createdAt: 'x', data: structuredClone(sample), snapshots: [] }] }
  for (let i = 0; i < 3; i++) root = applyCommand(root, { type: 'checkAcceptance', projectId: 'p1', target: 'feature', id: 'f6', index: i, done: true })
  assert.equal(deriveDodAlerts(root.projects[0].data).some((a) => a.id === 'dod:f6'), false)
})

// ── The answer a person reads in the feature panel ─────────────────────────
import { impactAnswer, dependencyCandidates } from '../src/lib/impact'

test('impactAnswer on the Sample: f6 touches f8 directly, the six steps after E, in flow order', () => {
  const a = impactAnswer(sample, 'f6')
  assert.deepEqual(a.direct, ['f8'])
  assert.deepEqual(a.indirect, [])
  assert.deepEqual(a.viaWorkflow, [], 'f8 is reached by its dependency first, so it is not listed twice')
  assert.equal(a.steps.length, 6)
  assert.equal(a.steps[a.steps.length - 1], 'K', 'End is read last')
  assert.match(a.sentence, /touches 1 feature, 6 workflow steps and \d+ lanes/)
})

test('impactAnswer says so when nothing is touched, still with the word "touch"', () => {
  const a = impactAnswer(sample, 'f1')
  assert.deepEqual([a.direct, a.indirect, a.viaWorkflow, a.steps], [[], [], [], []])
  assert.match(a.sentence, /touches nothing else on this board/)
})

test('impactAnswer separates direct from indirect dependents', () => {
  const d = templateData('blank')
  d.modules = [{ id: 'm', name: 'M', color: '#000', backbone: { name: '', sub: '' }, owners: [] }]
  d.features = [
    { id: 'a', moduleId: 'm', name: 'A', status: 'must', releaseId: 'mvp' },
    { id: 'b', moduleId: 'm', name: 'B', status: 'must', releaseId: 'mvp', dependsOn: ['a'] },
    { id: 'c', moduleId: 'm', name: 'C', status: 'must', releaseId: 'mvp', dependsOn: ['b'] },
  ]
  const a = impactAnswer(d, 'a')
  assert.deepEqual([a.direct, a.indirect], [['b'], ['c']])
  assert.equal(a.sentence, 'Changing it touches 2 features.')
  // c already depends on a through b: offering a → c would make a cycle
  assert.deepEqual(dependencyCandidates(d, 'a'), [])
  assert.deepEqual(dependencyCandidates(d, 'c'), ['a'], 'b is already declared, a is not')
})
