import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { applyCommand, seedOrgBoardNodes, type Root } from '../src/shared/board'
import { orgBoardIssues } from '../src/shared/orgboard'
import type { Feature } from '../src/store/types'
import { authorizeCommand } from './scope'
import type { Catalog } from './infra/store'
import type { User } from './auth'
import type { Command } from '../src/shared/board'

// Org boards (system maps): reducer semantics + per-user authorization.

const t0 = new Date(0).toISOString()
const root = (): Root => ({
  orgs: [{ id: 'oA', name: 'A', ownerId: 'uA' }],
  projects: [],
  orgBoards: [],
})

const withBoard = (): Root =>
  applyCommand(root(), {
    type: 'createOrgBoard',
    id: 'b1',
    orgId: 'oA',
    name: 'Map',
    createdAt: t0,
    nodes: [
      { id: 'n1', projectId: 'pA', label: 'Web', x: 0, y: 0 },
      { id: 'n2', label: 'Stripe', x: 300, y: 0 },
    ],
  })

test('createOrgBoard seeds the passed nodes; an org can hold several boards', () => {
  let r = withBoard()
  r = applyCommand(r, { type: 'createOrgBoard', id: 'b2', orgId: 'oA', name: 'Prod topology', createdAt: t0 })
  assert.equal(r.orgBoards!.length, 2)
  assert.equal(r.orgBoards![0].nodes.length, 2)
  assert.equal(r.orgBoards![1].nodes.length, 0)
})

test('seedOrgBoardNodes makes one project-linked node per project on a grid', () => {
  const nodes = seedOrgBoardNodes(
    [
      { id: 'p1', name: 'Web' },
      { id: 'p2', name: 'API' },
      { id: 'p3', name: 'Billing' },
      { id: 'p4', name: 'Jobs' },
    ],
    (() => {
      let i = 0
      return () => `n${++i}`
    })(),
  )
  assert.equal(nodes.length, 4)
  assert.deepEqual(nodes.map((n) => n.projectId), ['p1', 'p2', 'p3', 'p4'])
  assert.equal(nodes[3].y > nodes[0].y, true, 'fourth node wraps to the next row')
})

test('edges dedupe, ignore self-links, and die with their node', () => {
  let r = withBoard()
  r = applyCommand(r, { type: 'addOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', label: 'Charge', kind: 'api' })
  r = applyCommand(r, { type: 'addOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2' }) // duplicate
  r = applyCommand(r, { type: 'addOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n1' }) // self
  assert.equal(r.orgBoards![0].edges.length, 1)
  r = applyCommand(r, { type: 'updateOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', patch: { desc: 'POST /charges' } })
  assert.equal(r.orgBoards![0].edges[0].desc, 'POST /charges')
  r = applyCommand(r, { type: 'deleteOrgBoardNode', boardId: 'b1', id: 'n2' })
  assert.equal(r.orgBoards![0].nodes.length, 1)
  assert.equal(r.orgBoards![0].edges.length, 0, 'edges touching a deleted node are dropped')
})

test('edge anchors: carried on add, cleared by "" sentinel, cleared when the node re-points', () => {
  let r = withBoard()
  r = applyCommand(r, { type: 'addOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', fromFeatureId: 'fA' })
  assert.equal(r.orgBoards![0].edges[0].fromFeatureId, 'fA')

  // "" sentinel clears (undefined would be dropped by the JSON command transport)
  r = applyCommand(r, { type: 'updateOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', patch: { fromFeatureId: '' } })
  assert.equal(r.orgBoards![0].edges[0].fromFeatureId, undefined)

  // re-anchor, then re-point the node's project → anchor on that end is cleared
  r = applyCommand(r, { type: 'updateOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', patch: { fromFeatureId: 'fA', label: 'kept' } })
  r = applyCommand(r, { type: 'updateOrgBoardNode', boardId: 'b1', id: 'n1', patch: { projectId: 'pOther' } })
  assert.equal(r.orgBoards![0].edges[0].fromFeatureId, undefined, 'anchor cleared on project change')
  assert.equal(r.orgBoards![0].edges[0].label, 'kept', 'rest of the edge untouched')

  // a patch that does NOT touch projectId leaves anchors alone
  r = applyCommand(r, { type: 'updateOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', patch: { toFeatureId: 'fB' } })
  r = applyCommand(r, { type: 'updateOrgBoardNode', boardId: 'b1', id: 'n2', patch: { x: 5, y: 6 } })
  assert.equal(r.orgBoards![0].edges[0].toFeatureId, 'fB')
})

test('orgBoardIssues: dangling project/anchor are errors; empty contract & isolation are warnings', () => {
  const feats: Feature[] = [{ id: 'fA', moduleId: 'm', name: 'API', status: 'done', releaseId: 'r' }]
  const board = {
    id: 'b1',
    orgId: 'oA',
    name: 'Map',
    createdAt: t0,
    nodes: [
      { id: 'n1', projectId: 'pA', label: 'Web', x: 0, y: 0 },
      { id: 'n2', projectId: 'pGone', label: 'Ghost', x: 1, y: 0 },
      { id: 'n3', label: 'Lonely', x: 2, y: 0 },
    ],
    edges: [{ from: 'n1', to: 'n2', fromFeatureId: 'fMissing' }],
  }
  const issues = orgBoardIssues(board, {
    knownProjectIds: new Set(['pA']),
    featureLookup: (pid) => (pid === 'pA' ? feats : undefined),
    siblingNames: ['map'],
  })
  const kinds = issues.map((i) => `${i.severity}:${i.kind}`)
  assert.ok(kinds.includes('error:dangling_project'), 'ghost project')
  assert.ok(kinds.includes('error:dangling_anchor'), 'missing feature anchor')
  assert.ok(kinds.includes('warning:empty_contract'), 'edge without desc')
  assert.ok(kinds.includes('warning:isolated_system'), 'unconnected node')
  assert.ok(kinds.includes('warning:duplicate_board_name'), 'case-insensitive dup name')
  // unloaded project (pGone lookup undefined) must not fabricate anchor errors
  assert.equal(issues.filter((i) => i.kind === 'dangling_anchor').length, 1)
})

test('orgBoardIssues: anchor on an external (projectless) node is an error', () => {
  const board = {
    id: 'b1', orgId: 'oA', name: 'Map', createdAt: t0,
    nodes: [
      { id: 'n1', label: 'Stripe', x: 0, y: 0 },
      { id: 'n2', projectId: 'pA', label: 'Web', x: 1, y: 0 },
    ],
    edges: [{ from: 'n1', to: 'n2', fromFeatureId: 'fX', desc: 'ok' }],
  }
  const issues = orgBoardIssues(board, { knownProjectIds: new Set(['pA']), featureLookup: () => undefined })
  assert.ok(issues.some((i) => i.kind === 'anchor_without_project' && i.severity === 'error'))
})

test('drift: linkOrgEdgeCode + markOrgEdgeStale + reconcile semantics', () => {
  let r = withBoard()
  r = applyCommand(r, { type: 'addOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', desc: 'v1 contract' })
  r = applyCommand(r, { type: 'linkOrgEdgeCode', boardId: 'b1', from: 'n1', to: 'n2', ref: { path: 'src/api/orders.ts' }, op: 'link' })
  assert.equal(r.orgBoards![0].edges[0].codeRefs!.length, 1)

  r = applyCommand(r, { type: 'markOrgEdgeStale', boardId: 'b1', edges: [{ from: 'n1', to: 'n2' }], stale: true })
  assert.equal(r.orgBoards![0].edges[0].codeStale, true)

  // a label tweak is NOT a reconciliation
  r = applyCommand(r, { type: 'updateOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', patch: { label: 'renamed' } })
  assert.equal(r.orgBoards![0].edges[0].codeStale, true, 'label change keeps stale')

  // touching the contract (desc) IS a reconciliation
  r = applyCommand(r, { type: 'updateOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2', patch: { desc: 'v2 contract' } })
  assert.equal(r.orgBoards![0].edges[0].codeStale, false, 'desc change clears stale')

  // re-linking code also reconciles
  r = applyCommand(r, { type: 'markOrgEdgeStale', boardId: 'b1', edges: [{ from: 'n1', to: 'n2' }], stale: true })
  r = applyCommand(r, { type: 'linkOrgEdgeCode', boardId: 'b1', from: 'n1', to: 'n2', ref: { path: 'src/api/orders.ts' }, op: 'link' })
  assert.equal(r.orgBoards![0].edges[0].codeStale, false)
  assert.equal(r.orgBoards![0].edges[0].codeRefs!.length, 1, 'same path+symbol replaces, not duplicates')
})

test('deleteOrg removes its org boards', () => {
  let r = withBoard()
  r = applyCommand(r, { type: 'deleteOrg', id: 'oA' })
  assert.equal(r.orgBoards!.length, 0)
})

// ── Authorization ─────────────────────────────────────────────────────────────

const userA: User = { id: 'uA', email: 'a@x.com', name: 'A', salt: '', hash: '', role: 'user', createdAt: t0 }
const userB: User = { ...userA, id: 'uB', email: 'b@x.com', name: 'B' }

const catalog: Catalog = {
  orgs: [
    { id: 'oA', name: 'A workspace', ownerId: 'uA' },
    { id: 'oB', name: 'B workspace', ownerId: 'uB' },
  ],
  headers: [],
}
const boardOrg = (id: string) => (id === 'b1' ? 'oA' : undefined)

const denies = (user: User, cmd: Command) =>
  assert.throws(() => authorizeCommand(user, cmd, catalog, boardOrg), /forbidden/, `expected ${cmd.type} to be denied`)
const allows = (user: User, cmd: Command) => authorizeCommand(user, cmd, catalog, boardOrg)

test('org-board commands are scoped to the owning user', () => {
  allows(userA, { type: 'createOrgBoard', id: 'bX', orgId: 'oA', name: 'Map', createdAt: t0 })
  denies(userB, { type: 'createOrgBoard', id: 'bX', orgId: 'oA', name: 'Map', createdAt: t0 })

  allows(userA, { type: 'renameOrgBoard', id: 'b1', name: 'Renamed' })
  denies(userB, { type: 'renameOrgBoard', id: 'b1', name: 'Renamed' })
  denies(userA, { type: 'deleteOrgBoard', id: 'missing' })

  allows(userA, { type: 'addOrgBoardNode', boardId: 'b1', id: 'n9', x: 0, y: 0 })
  denies(userB, { type: 'addOrgBoardNode', boardId: 'b1', id: 'n9', x: 0, y: 0 })
  denies(userB, { type: 'addOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2' })
  denies(userB, { type: 'deleteOrgBoardEdge', boardId: 'b1', from: 'n1', to: 'n2' })
})
