import { strict as assert } from 'node:assert'
import { after, test } from 'node:test'
import { closeDb } from './db'
import { activityRepo, keyRepo, orgRepo, projectRepo, searchRepo, sessionRepo, shareRepo, userRepo } from './repositories'
import { templateData } from '../../src/store/seed'

// Round-trip smoke test against a live Postgres. Skips entirely when
// DATABASE_URL is unset so CI without a DB stays green.
const hasDb = !!process.env.DATABASE_URL
const run = hasDb ? test : test.skip

const uid = `u_test_${Date.now()}`
const oid = `org_test_${Date.now()}`
const pid = `p_test_${Date.now()}`

after(async () => {
  // Cascade: deleting the user wipes org → project → key/share/activity.
  if (hasDb) {
    const { requireDb } = await import('./db')
    const { eq } = await import('drizzle-orm')
    const t = await import('./schema')
    await requireDb().delete(t.users).where(eq(t.users.id, uid))
    await closeDb()
  }
})

run('user → org → project round-trip with cascade', async () => {
  await userRepo.insert({ id: uid, email: `${uid}@x.io`, name: 'Test', salt: 's', hash: 'h', role: 'admin', createdAt: new Date().toISOString() })
  await orgRepo.insert({ id: oid, name: 'Test org', ownerId: uid })
  await projectRepo.save({ id: pid, orgId: oid, name: 'Test project', createdAt: new Date().toISOString(), data: templateData('blank'), snapshots: [] })

  const users = await userRepo.all()
  assert.ok(users.find((u) => u.id === uid), 'user persisted')
  const orgs = await orgRepo.all()
  assert.ok(orgs.find((o) => o.id === oid && o.ownerId === uid), 'org persisted with owner')
  const projects = await projectRepo.all()
  const p = projects.find((x) => x.id === pid)
  assert.ok(p, 'project persisted')
  assert.ok(Array.isArray(p!.data.modules), 'board data round-trips as jsonb')
})

run('save() overwrites board + bumps version', async () => {
  const data = templateData('blank')
  data.modules.push({ id: 'm1', name: 'M1', color: '#000', backbone: { name: 'M1', sub: '' }, owners: [] })
  await projectRepo.save({ id: pid, orgId: oid, name: 'Renamed', createdAt: new Date().toISOString(), data, snapshots: [] })
  const p = (await projectRepo.all()).find((x) => x.id === pid)!
  assert.equal(p.name, 'Renamed')
  assert.ok(p.data.modules.find((m) => m.id === 'm1'), 'updated board persisted')
})

run('keys / shares / activity attach to project', async () => {
  await keyRepo.insert({ id: 'k_test', userId: uid, orgId: oid, name: 'agent', keyHash: 'hash_test', keyPrefix: 'kt_live_ab', createdAt: new Date().toISOString(), lastUsedAt: null })
  await shareRepo.insert({ token: 'kts_test', projectId: pid, createdAt: new Date().toISOString() })
  await activityRepo.insert({ id: '0', projectId: pid, ts: Date.now(), actor: { kind: 'agent', name: 'agent' }, summary: 'added module', kind: 'change' })

  assert.ok((await keyRepo.all()).find((k) => k.id === 'k_test'), 'key persisted (hashed)')
  assert.ok((await shareRepo.all()).find((s) => s.token === 'kts_test'), 'share persisted')
  const since = await activityRepo.since(pid, 0)
  assert.equal(since.length, 1, 'activity cursor read works')
  assert.equal(since[0].summary, 'added module')
})

run('search projection: reindex + org-scoped query', async () => {
  const p = (await projectRepo.all()).find((x) => x.id === pid)!
  await searchRepo.reindex(p) // p has module 'm1' labelled 'M1' from the save test
  const hits = await searchRepo.search(oid, 'M1')
  assert.ok(hits.some((h) => h.kind === 'module' && h.label === 'M1'), 'module found via projection')
  assert.equal((await searchRepo.search(oid, 'zzz-no-such-thing')).length, 0, 'no false positives')
  assert.equal((await searchRepo.search('other-org', 'M1')).length, 0, 'scoped to the org')
})

run('activity recent() returns the NEWEST entries (oldest→newest); trim bounds the table', async () => {
  for (let i = 1; i <= 5; i++) {
    await activityRepo.insert({ id: '0', projectId: pid, ts: Date.now() + i, actor: { kind: 'agent', name: 'a' }, summary: `e${i}`, kind: 'change' })
  }
  const recent = (await activityRepo.recent(3)).filter((r) => r.projectId === pid)
  assert.equal(recent.at(-1)?.summary, 'e5', 'most recent entry is last in the warmed ring')
  assert.ok(!recent.some((r) => r.summary === 'e1'), 'oldest entries are not in the newest-3 window')

  await activityRepo.trim(pid, 2)
  const left = await activityRepo.since(pid, 0, 100)
  assert.equal(left.length, 2, 'table bounded to the cap')
  assert.deepEqual(
    left.map((r) => r.summary),
    ['e4', 'e5'],
    'kept the two newest, ascending',
  )
})

run('session insert + delete', async () => {
  await sessionRepo.insert({ token: 'sess_test', userId: uid, expiresAt: Date.now() + 1000 })
  assert.ok((await sessionRepo.all()).find((s) => s.token === 'sess_test'))
  await sessionRepo.delete('sess_test')
  assert.ok(!(await sessionRepo.all()).find((s) => s.token === 'sess_test'))
})
