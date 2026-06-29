import { strict as assert } from 'node:assert'
import { after, test } from 'node:test'
import { closeDb, isPgEnabled } from './db'
import { activityRepo, keyRepo, orgRepo, projectRepo, sessionRepo, shareRepo, userRepo } from './repositories'
import { templateData } from '../../src/store/seed'

// Round-trip smoke test against a live Postgres. Skips entirely when
// DATABASE_URL is unset so CI without a DB stays green.
const run = isPgEnabled() ? test : test.skip

const uid = `u_test_${Date.now()}`
const oid = `org_test_${Date.now()}`
const pid = `p_test_${Date.now()}`

after(async () => {
  // Cascade: deleting the user wipes org → project → key/share/activity.
  if (isPgEnabled()) {
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

run('session insert + delete', async () => {
  await sessionRepo.insert({ token: 'sess_test', userId: uid, expiresAt: Date.now() + 1000 })
  assert.ok((await sessionRepo.all()).find((s) => s.token === 'sess_test'))
  await sessionRepo.delete('sess_test')
  assert.ok(!(await sessionRepo.all()).find((s) => s.token === 'sess_test'))
})
