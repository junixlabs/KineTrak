import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { deriveToolCall, instrumentToolCalls, type InstrumentOptions, type ToolCallRecord } from './toolLog'

const json = (obj: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] })
const ctx = { orgId: 'o1', keyId: 'k1', actor: 'agent-key' }

/**
 * A real McpServer wired to a real Client over InMemoryTransport — the only setup
 * that exercises what this module actually hooks (the SDK's tools/call handler,
 * including the failures the SDK answers without ever reaching a callback).
 */
async function harness(register: (s: McpServer) => void, opts: Omit<InstrumentOptions, 'sink'> = {}) {
  const server = new McpServer({ name: 'test', version: '1.0.0' })
  register(server)
  const records: ToolCallRecord[] = []
  const installed = instrumentToolCalls(server, ctx, { ...opts, sink: (_c, rec) => records.push(rec) })

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return {
    installed,
    records,
    client,
    async close() {
      await client.close()
      await server.close()
    },
  }
}

test('a json({error}) payload is recorded as a failure, not a success', () => {
  const rec = deriveToolCall('create_snapshot', { name: 'v3' }, json({ error: 'create_snapshot refused: 2 error-severity board issue(s)' }))
  assert.equal(rec.outcome, 'error')
})

test('a normal payload is a success', () => {
  assert.equal(deriveToolCall('add_module', { name: 'Checkout' }, json({ id: 'm1' })).outcome, 'ok')
})

test('a payload merely containing the word error is not a failure', () => {
  assert.equal(deriveToolCall('search', { query: 'x' }, json({ hits: [{ label: 'error handling' }] })).outcome, 'ok')
})

test('isError:true is a failure even without an error key', () => {
  assert.equal(deriveToolCall('x', {}, { isError: true, content: [] }).outcome, 'error')
})

test('an oversized payload is not parsed, so a huge successful read stays ok', () => {
  const huge = { content: [{ type: 'text', text: `{"error":"x","pad":"${'p'.repeat(70 * 1024)}"}` }] }
  assert.equal(deriveToolCall('get_board', {}, huge).outcome, 'ok')
})

test('a non-JSON text payload is a success', () => {
  assert.equal(deriveToolCall('x', {}, { content: [{ type: 'text', text: 'plain prose' }] }).outcome, 'ok')
})

test('a bulk_apply that reports failed ops is a failure, however many succeeded', () => {
  const allFailed = json({ ok: false, applied: 0, failed: 100, results: [] })
  assert.equal(deriveToolCall('bulk_apply', { ops: [] }, allFailed).outcome, 'error')
  const partial = json({ ok: false, applied: 99, failed: 1, results: [] })
  assert.equal(deriveToolCall('bulk_apply', { ops: [] }, partial).outcome, 'error')
  const clean = json({ ok: true, applied: 100, failed: 0, results: [] })
  assert.equal(deriveToolCall('bulk_apply', { ops: [] }, clean).outcome, 'ok', 'failed:0 is the success case')
})

test('ok:false alone is NOT a failure — validate_board reports it about the board', () => {
  const report = json({ ok: false, issues: [{ severity: 'error', message: 'orphan feature' }] })
  assert.equal(deriveToolCall('validate_board', { projectId: 'p1' }, report).outcome, 'ok')
})

test('parameter names are recorded, sorted, with no values — the AC3 guard', () => {
  const rec = deriveToolCall('report_friction', { workaround: 'called arrange_swimlane', tool: 'add_swim_node', projectId: 'p1' }, json({ ok: true }))
  assert.deepEqual(rec.params, ['projectId', 'tool', 'workaround'])
  const dump = JSON.stringify(rec)
  for (const value of ['called arrange_swimlane', 'add_swim_node']) {
    assert.ok(!dump.includes(value), `the record must not carry the argument value "${value}"`)
  }
  assert.equal(rec.projectId, 'p1', 'projectId is the one deliberate carve-out (scope identity)')
})

test('a call that named no project is recorded under the project the server defaults to', () => {
  const rec = deriveToolCall('get_board', {}, json({ id: 'p1' }), false, 'p1')
  assert.equal(rec.projectId, 'p1', 'otherwise one session splits into null and p1 runs whose chains never close')
  assert.deepEqual(rec.params, [], 'the default is scope, not a parameter the caller sent')
})

test('an explicit projectId always wins over the default', () => {
  assert.equal(deriveToolCall('get_board', { projectId: 'p2' }, json({}), false, 'p1').projectId, 'p2')
})

test('no argument value survives an instrumented call', async () => {
  const h = await harness((s) =>
    s.registerTool('update_feature', { inputSchema: { projectId: z.string(), id: z.string(), name: z.string(), desc: z.string() } }, async () =>
      json({ ok: true }),
    ),
  )
  await h.client.callTool({
    name: 'update_feature',
    arguments: { projectId: 'p1', id: 'f1', name: 'SECRET-CUSTOMER-NAME', desc: 'confidential board content' },
  })
  assert.equal(h.records.length, 1)
  assert.deepEqual(h.records[0].params, ['desc', 'id', 'name', 'projectId'])
  const dump = JSON.stringify(h.records[0])
  for (const value of ['SECRET-CUSTOMER-NAME', 'confidential board content', 'f1']) {
    assert.ok(!dump.includes(value), `"${value}" leaked into a tool_calls record`)
  }
  await h.close()
})

test('a schema-less and a schema-d tool each record exactly one row', async () => {
  const h = await harness((s) => {
    s.registerTool('list_projects', { description: 'no input schema' }, async () => json([{ id: 'p1' }]))
    s.registerTool('create_snapshot', { inputSchema: { projectId: z.string(), name: z.string() } }, async ({ name }) =>
      json({ error: `create_snapshot refused while making ${name}` }),
    )
  })
  const read = await h.client.callTool({ name: 'list_projects', arguments: {} })
  assert.deepEqual(read.content, json([{ id: 'p1' }]).content, 'the payload reaches the client unchanged')
  await h.client.callTool({ name: 'create_snapshot', arguments: { projectId: 'p1', name: 'v3 SECRET-RELEASE' } })

  assert.deepEqual(
    h.records.map((r) => [r.tool, r.outcome, r.params.join(','), r.projectId]),
    [
      ['list_projects', 'ok', '', null],
      ['create_snapshot', 'error', 'name,projectId', 'p1'],
    ],
  )
  assert.ok(!JSON.stringify(h.records).includes('SECRET-RELEASE'), 'no argument value reached a record')
  await h.close()
})

test('a thrown Error is recorded as a failure and still reaches the client as one', async () => {
  const h = await harness((s) =>
    s.registerTool('get_changes_since', { inputSchema: { projectId: z.string() } }, async () => {
      throw new Error('project not found in this workspace')
    }),
  )
  const res = await h.client.callTool({ name: 'get_changes_since', arguments: { projectId: 'nope' } })
  assert.equal(res.isError, true, 'the SDK still turns the throw into a tool error for the caller')
  assert.deepEqual(
    h.records.map((r) => [r.tool, r.outcome]),
    [['get_changes_since', 'error']],
  )
  await h.close()
})

// cm:why these three are the whole reason the hook sits on the request and not on a callback: the
// SDK answers each above every callback, and a wrong parameter shape is the commonest failure of all.
test('the failures the SDK answers by itself are recorded too', async () => {
  const h = await harness((s) => {
    s.registerTool('add_module', { inputSchema: { projectId: z.string(), name: z.string() } }, async () => json({ id: 'm1' }))
    s.registerTool('retired_tool', { inputSchema: { projectId: z.string() } }, async () => json({ ok: true })).disable()
  })

  await h.client.callTool({ name: 'add_modul', arguments: { name: 'Checkout' } })
  await h.client.callTool({ name: 'retired_tool', arguments: { projectId: 'p1' } })
  await h.client.callTool({ name: 'add_module', arguments: { projectId: 'p1', name: 42 } })

  assert.deepEqual(
    h.records.map((r) => [r.tool, r.outcome]),
    [
      ['add_modul', 'error'],
      ['retired_tool', 'error'],
      ['add_module', 'error'],
    ],
  )
  assert.deepEqual(h.records[2].params, ['name', 'projectId'], 'the shape that was rejected is exactly what a maintainer needs')
  await h.close()
})

test('the default project id is resolved per call, not captured once', async () => {
  let current: string | null = 'p1'
  const h = await harness((s) => s.registerTool('next_action', { inputSchema: { projectId: z.string().optional() } }, async () => json({ ok: true })), {
    defaultProjectId: () => current,
  })
  await h.client.callTool({ name: 'next_action', arguments: {} })
  current = 'p2'
  await h.client.callTool({ name: 'next_action', arguments: {} })
  assert.deepEqual(
    h.records.map((r) => r.projectId),
    ['p1', 'p2'],
  )
  await h.close()
})

test('a failing sink never breaks the tool call', async () => {
  const server = new McpServer({ name: 'test', version: '1.0.0' })
  server.registerTool('validate_board', { inputSchema: { projectId: z.string() } }, async () => json({ ok: true }))
  instrumentToolCalls(server, ctx, {
    sink: () => {
      throw new Error('DB is down')
    },
  })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  const res = await client.callTool({ name: 'validate_board', arguments: { projectId: 'p1' } })
  assert.deepEqual(res.content, json({ ok: true }).content)
  await client.close()
  await server.close()
})

test('registration order does not matter: a tool registered last is still recorded', async () => {
  const server = new McpServer({ name: 'test', version: '1.0.0' })
  server.registerTool('first', { inputSchema: {} }, async () => json({ n: 1 }))
  const installed = instrumentToolCalls(server, ctx, { sink: () => {} })
  assert.equal(installed, true)
  const records: ToolCallRecord[] = []
  instrumentToolCalls(server, ctx, { sink: (_c, rec) => records.push(rec) })
  server.registerTool('last', { inputSchema: {} }, async () => json({ n: 2 }))

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  await client.callTool({ name: 'last', arguments: {} })
  assert.deepEqual(
    records.map((r) => r.tool),
    ['last'],
  )
  await client.close()
  await server.close()
})

test('a server with no tools reports that the instrument was NOT installed', () => {
  const server = new McpServer({ name: 'test', version: '1.0.0' })
  assert.equal(instrumentToolCalls(server, ctx, { sink: () => {} }), false, 'silent absence is the one failure mode worth shouting about')
})

// ── A person's impact question (feature panel) lands in the same log ────────
import { recordPanelImpactQuery, PANEL_IMPACT_QUERY, type ToolCallContext } from './toolLog'
import { splitImpactQueries } from './adoptionAnalysis'

test('a panel impact query is a names-only row under the person\'s own key, and counts as a query', () => {
  const rows: { ctx: ToolCallContext; rec: ToolCallRecord }[] = []
  recordPanelImpactQuery({ orgId: 'o1', userId: 'u7', actor: 'Lan' }, 'p1', (ctx, rec) => rows.push({ ctx, rec }))
  assert.deepEqual(rows, [{ ctx: { orgId: 'o1', keyId: 'web:u7', actor: 'Lan' }, rec: { tool: PANEL_IMPACT_QUERY, params: [], outcome: 'ok', projectId: 'p1' } }])
  const { queries, failed } = splitImpactQueries([{ ...rows[0].rec, ts: 1 }])
  assert.deepEqual([queries, failed], [[{ projectId: 'p1', ts: 1 }], 0])
})
