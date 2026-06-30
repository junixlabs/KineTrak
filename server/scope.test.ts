import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { authorizeCommand, userOwnsOrg } from './scope'
import type { Catalog } from './infra/store'
import type { User } from './auth'
import type { Command } from '../src/shared/board'

// Two accounts, each with one org + one project. The authorization boundary must
// never let one account touch the other's data — verified here without a DB by
// injecting an explicit catalog.

const userA: User = { id: 'uA', email: 'a@x.com', name: 'A', salt: '', hash: '', role: 'user', createdAt: new Date(0).toISOString() }
const userB: User = { ...userA, id: 'uB', email: 'b@x.com', name: 'B' }

const catalog: Catalog = {
  orgs: [
    { id: 'oA', name: 'A workspace', ownerId: 'uA' },
    { id: 'oB', name: 'B workspace', ownerId: 'uB' },
  ],
  headers: [
    { id: 'pA', orgId: 'oA', name: 'Project A', createdAt: new Date(0).toISOString() },
    { id: 'pB', orgId: 'oB', name: 'Project B', createdAt: new Date(0).toISOString() },
  ],
}

const denies = (user: User, cmd: Command) =>
  assert.throws(() => authorizeCommand(user, cmd, catalog), /forbidden/, `expected ${cmd.type} to be denied`)
const allows = (user: User, cmd: Command) => authorizeCommand(user, cmd, catalog)

test('userOwnsOrg only matches the owner', () => {
  assert.equal(userOwnsOrg('uA', 'oA', catalog), true)
  assert.equal(userOwnsOrg('uB', 'oA', catalog), false)
  assert.equal(userOwnsOrg('uA', 'missing', catalog), false)
})

test('createOrg is always allowed and stamps the session owner', () => {
  const out = authorizeCommand(userA, { type: 'createOrg', id: 'oNew', name: 'New' }, catalog)
  assert.deepEqual(out, { type: 'createOrg', id: 'oNew', name: 'New', ownerId: 'uA' })
})

test('org lifecycle is gated by ownership', () => {
  allows(userA, { type: 'renameOrg', id: 'oA', name: 'x' })
  allows(userA, { type: 'deleteOrg', id: 'oA' })
  denies(userB, { type: 'renameOrg', id: 'oA', name: 'x' })
  denies(userB, { type: 'deleteOrg', id: 'oA' })
  denies(userA, { type: 'deleteOrg', id: 'missing' })
})

test('createProject only into an owned org', () => {
  const mk = (orgId: string): Command => ({ type: 'createProject', id: 'pNew', orgId, name: 'N', template: 'blank', createdAt: new Date(0).toISOString() })
  allows(userA, mk('oA'))
  denies(userA, mk('oB')) // cannot drop a project into someone else's workspace
})

test('rename/deleteProject is gated by the project owner', () => {
  allows(userA, { type: 'renameProject', id: 'pA', name: 'x' })
  allows(userA, { type: 'deleteProject', id: 'pA' })
  denies(userB, { type: 'renameProject', id: 'pA', name: 'x' })
  denies(userB, { type: 'deleteProject', id: 'pA' })
  denies(userA, { type: 'deleteProject', id: 'missing' }) // unknown project → deny
})

test('board commands are scoped to the project owner', () => {
  const mod = (projectId: string): Command => ({ type: 'addModule', projectId, id: 'm1', name: 'M' })
  allows(userA, mod('pA'))
  denies(userB, mod('pA')) // B may not edit A's board
  denies(userA, mod('pB')) // A may not edit B's board
  denies(userA, mod('missing')) // unknown project → deny
})

test('a board command without a projectId is denied', () => {
  denies(userA, { type: 'addModule', id: 'm1', name: 'M' } as unknown as Command)
})
