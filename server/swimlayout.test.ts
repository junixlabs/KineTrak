import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { autoArrangeSwimlane, arrangeAllFlows } from '../src/lib/swimlayout'
import type { SwimNode, SwimEdge, SwimLane } from '../src/shared/types'

const lanes: SwimLane[] = [
  { id: 0, name: 'L0', sub: '', color: '#000', owners: [], y: 40, h: 100 },
  { id: 1, name: 'L1', sub: '', color: '#000', owners: [], y: 140, h: 100 },
]

const node = (id: string, lane: number, flowId?: string, x = 0): SwimNode => ({
  id, label: id, lane, flowId, kind: 'process', status: 'todo', x, y: 0,
})

test('autoArrangeSwimlane spreads same-lane nodes across columns', () => {
  const nodes = [node('a', 0), node('b', 0), node('c', 1)]
  const edges: SwimEdge[] = [{ from: 'a', to: 'b' }]
  const pos = autoArrangeSwimlane(nodes, edges, lanes)
  const byId = new Map(pos.map((p) => [p.id, p]))
  assert.ok(byId.get('a')!.x < byId.get('b')!.x, 'edge target sits right of its source')
  const lane0 = pos.filter((p) => ['a', 'b'].includes(p.id))
  assert.notEqual(lane0[0].x, lane0[1].x, 'same-lane nodes never share a column')
})

test('scoped arrange starts clear of avoided nodes (no flow stacking)', () => {
  // Flow "f1" already sits at x=60..280; arranging flow "f2" must not overlap it.
  const placed = [node('a', 0, 'f1', 60), node('b', 0, 'f1', 280)]
  const toArrange = [node('c', 0, 'f2'), node('d', 1, 'f2')]
  const pos = autoArrangeSwimlane(toArrange, [{ from: 'c', to: 'd' }], lanes, placed)
  const maxAvoidX = Math.max(...placed.map((n) => n.x))
  pos.forEach((p) => assert.ok(p.x > maxAvoidX, `${p.id} (x=${p.x}) must start right of the placed flow (x≤${maxAvoidX})`))
})

test('unscoped arrange (no avoid) starts clear of the lane title block', () => {
  const pos = autoArrangeSwimlane([node('a', 0)], [], lanes)
  assert.equal(pos[0].x, 220)
})

test('arrangeAllFlows tiles distinct flows into non-overlapping x-bands', () => {
  // Two flows, each a 2-step chain in lane 0, all starting at the same origin.
  const nodes = [
    node('a', 0, 'f1'), node('b', 0, 'f1'),
    node('c', 0, 'f2'), node('d', 0, 'f2'),
  ]
  const edges: SwimEdge[] = [{ from: 'a', to: 'b' }, { from: 'c', to: 'd' }]
  const pos = arrangeAllFlows(nodes, edges, lanes)
  const byId = new Map(pos.map((p) => [p.id, p]))
  const f1MaxX = Math.max(byId.get('a')!.x, byId.get('b')!.x)
  const f2MinX = Math.min(byId.get('c')!.x, byId.get('d')!.x)
  assert.ok(f2MinX > f1MaxX, `flow f2 (minX=${f2MinX}) must sit right of flow f1 (maxX=${f1MaxX}) — no shared band`)
  // No two nodes in the same lane share an x column across the whole board.
  const xs = pos.map((p) => p.x)
  assert.equal(new Set(xs).size, xs.length, 'every node in the single lane claims a distinct column')
})

test('lane centering uses the per-kind node height', () => {
  const start: SwimNode = { ...node('s', 0), kind: 'start' } // h=46
  const decision: SwimNode = { ...node('d', 0), kind: 'decision' } // h=66
  const pos = autoArrangeSwimlane([start, decision], [], lanes)
  const byId = new Map(pos.map((p) => [p.id, p]))
  assert.equal(byId.get('s')!.y, Math.round(40 + (100 - 46) / 2))
  assert.equal(byId.get('d')!.y, Math.round(40 + (100 - 66) / 2))
})
