import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { ProjectRegistry } from './ProjectRegistry'
import type { Store } from '../infra/store'
import type { Project } from '../../src/store/types'
import { templateData } from '../../src/store/seed'

function mkProject(id: string): Project {
  return { id, orgId: 'o1', name: id, createdAt: new Date(0).toISOString(), data: templateData('blank'), snapshots: [] }
}

// In-memory fake Store that counts loads, so we can prove on-demand + caching.
function fakeStore(projects: Project[]): { store: Store; loads: () => number } {
  const map = new Map(projects.map((p) => [p.id, p]))
  let loadCount = 0
  const store: Store = {
    async loadCatalog() {
      return { orgs: [], headers: [...map.values()].map((p) => ({ id: p.id, orgId: p.orgId, name: p.name, createdAt: p.createdAt })) }
    },
    async loadProject(id) {
      loadCount++
      return map.get(id) ?? null
    },
    async saveProject(p) {
      map.set(p.id, p)
    },
    async insertOrg() {},
    async renameOrg() {},
    async deleteOrg() {},
    async renameProject() {},
    async deleteProject() {},
    async loadOrgBoards() {
      return []
    },
    async saveOrgBoard() {},
    async deleteOrgBoard() {},
    async search() {
      return []
    },
  }
  return { store, loads: () => loadCount }
}

test('acquire loads once, then serves from the identity map', async () => {
  const { store, loads } = fakeStore([mkProject('p1')])
  const reg = new ProjectRegistry(store)
  const a = await reg.acquire('p1')
  const b = await reg.acquire('p1')
  assert.ok(a && b)
  assert.equal(a, b, 'same instance returned (identity map)')
  assert.equal(loads(), 1, 'loaded from store exactly once')
  assert.equal(reg.residentCount(), 1)
})

test('concurrent acquires of the same id share one load', async () => {
  const { store, loads } = fakeStore([mkProject('p1')])
  const reg = new ProjectRegistry(store)
  const [a, b, c] = await Promise.all([reg.acquire('p1'), reg.acquire('p1'), reg.acquire('p1')])
  assert.equal(a, b)
  assert.equal(b, c)
  assert.equal(loads(), 1, 'deduped to a single store load')
})

test('acquire returns null for a missing project', async () => {
  const { store } = fakeStore([])
  const reg = new ProjectRegistry(store)
  assert.equal(await reg.acquire('nope'), null)
  assert.equal(reg.residentCount(), 0)
})

test('idle aggregates are evicted; reload re-reads the store', async () => {
  const { store, loads } = fakeStore([mkProject('p1')])
  const reg = new ProjectRegistry(store) // default TTL
  const lp = (await reg.acquire('p1'))!
  assert.equal(reg.residentCount(), 1)
  lp.lastAccess = 0 // backdate well past the TTL
  reg.sweep()
  assert.equal(reg.residentCount(), 0, 'idle project evicted from RAM')
  await reg.acquire('p1')
  assert.equal(loads(), 2, 're-acquired after eviction reloaded from store')
})

test('an in-flight aggregate is not evicted mid-write', async () => {
  const { store } = fakeStore([mkProject('p1')])
  const reg = new ProjectRegistry(store)
  const lp = (await reg.acquire('p1'))!
  lp.lastAccess = 0
  lp.inFlight = 1 // simulate a write in progress
  reg.sweep()
  assert.equal(reg.residentCount(), 1, 'kept resident while a write is in flight')
})

test('aggregate serializes writes and persists', async () => {
  const { store } = fakeStore([mkProject('p1')])
  const reg = new ProjectRegistry(store)
  const lp = (await reg.acquire('p1'))!
  await lp.apply({ type: 'addModule', projectId: 'p1', id: 'm1', name: 'M1' })
  await lp.apply({ type: 'addModule', projectId: 'p1', id: 'm2', name: 'M2' })
  assert.equal(lp.project.data.modules.length, 2, 'both writes applied in order')
  const reloaded = await store.loadProject('p1')
  assert.equal(reloaded!.data.modules.length, 2, 'persisted to store')
})

test('apply rolls back the in-RAM board and does NOT poison the queue on save failure', async () => {
  const map = new Map([['p1', mkProject('p1')]])
  let failNext = false
  const store: Store = {
    async loadCatalog() {
      return { orgs: [], headers: [] }
    },
    async loadProject(id) {
      return map.get(id) ?? null
    },
    async saveProject(p) {
      if (failNext) {
        failNext = false
        throw new Error('transient DB error')
      }
      map.set(p.id, p)
    },
    async insertOrg() {},
    async renameOrg() {},
    async deleteOrg() {},
    async renameProject() {},
    async deleteProject() {},
    async loadOrgBoards() {
      return []
    },
    async saveOrgBoard() {},
    async deleteOrgBoard() {},
    async search() {
      return []
    },
  }
  const reg = new ProjectRegistry(store)
  const lp = (await reg.acquire('p1'))!

  failNext = true
  await assert.rejects(() => lp.apply({ type: 'addModule', projectId: 'p1', id: 'bad', name: 'BAD' }), /transient DB error/)
  assert.equal(lp.project.data.modules.length, 0, 'in-RAM board rolled back to pre-command state')

  // Queue is not poisoned — the very next command still runs and persists.
  await lp.apply({ type: 'addModule', projectId: 'p1', id: 'ok', name: 'OK' })
  assert.equal(lp.project.data.modules.length, 1, 'later command applied after the failure')
  assert.equal((await store.loadProject('p1'))!.data.modules.length, 1, 'and persisted')
})
