import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { deriveToolCall, instrumentToolRegistration, type ToolCallRecord } from './toolLog'

const json = (obj: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] })
const ctx = { orgId: 'o1', keyId: 'k1', actor: 'agent-key' }

/** A stand-in for McpServer that records what was registered, so the wrapper can be
 *  exercised without a transport, a client or a DB. */
function fakeServer() {
  const registered = new Map<string, { config: { inputSchema?: unknown } | undefined; handler: (...a: unknown[]) => unknown }>()
  const server = {
    registerTool(name: string, config: { inputSchema?: unknown } | undefined, handler: (...a: unknown[]) => unknown) {
      registered.set(name, { config, handler })
      return { name }
    },
  }
  const records: ToolCallRecord[] = []
  instrumentToolRegistration(server as unknown as McpServer, ctx, (_c, rec) => records.push(rec))
  return { server: server as unknown as McpServer, registered, records }
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

test('parameter names are recorded, sorted, with no values — the AC3 guard', () => {
  const rec = deriveToolCall('report_friction', { workaround: 'called arrange_swimlane', tool: 'add_swim_node', projectId: 'p1' }, json({ ok: true }))
  assert.deepEqual(rec.params, ['projectId', 'tool', 'workaround'])
  const dump = JSON.stringify(rec)
  for (const value of ['called arrange_swimlane', 'add_swim_node']) {
    assert.ok(!dump.includes(value), `the record must not carry the argument value "${value}"`)
  }
  assert.equal(rec.projectId, 'p1', 'projectId is the one deliberate carve-out (scope identity)')
})

test('no argument value survives an instrumented call', async () => {
  const { server, registered, records } = fakeServer()
  server.registerTool('update_feature', { inputSchema: { projectId: z.string(), id: z.string(), name: z.string(), desc: z.string() } }, async () => json({ ok: true }))
  await registered.get('update_feature')!.handler(
    { projectId: 'p1', id: 'f1', name: 'SECRET-CUSTOMER-NAME', desc: 'confidential board content' },
    {},
  )
  assert.equal(records.length, 1)
  const dump = JSON.stringify(records[0])
  assert.deepEqual(records[0].params, ['desc', 'id', 'name', 'projectId'])
  for (const value of ['SECRET-CUSTOMER-NAME', 'confidential board content', 'f1']) {
    assert.ok(!dump.includes(value), `"${value}" leaked into a tool_calls record`)
  }
})

test('a thrown Error is recorded as a failure AND still propagates', async () => {
  const { server, registered, records } = fakeServer()
  const boom = new Error('project not found in this workspace')
  server.registerTool('get_changes_since', { inputSchema: { projectId: z.string() } }, async () => {
    throw boom
  })
  await assert.rejects(() => Promise.resolve(registered.get('get_changes_since')!.handler({ projectId: 'nope' }, {})), boom)
  assert.deepEqual(
    records.map((r) => [r.tool, r.outcome]),
    [['get_changes_since', 'error']],
  )
})

test('the wrapper returns the handler result unchanged', async () => {
  const { server, registered } = fakeServer()
  const payload = json({ id: 'm1', name: 'Checkout' })
  server.registerTool('add_module', { inputSchema: { name: z.string() } }, async () => payload)
  assert.equal(await registered.get('add_module')!.handler({ name: 'Checkout' }, {}), payload)
})

test('a schema-less tool is called with extra as its only argument', async () => {
  const { server, registered, records } = fakeServer()
  const extra = { requestId: 'r1' }
  let seen: unknown[] = []
  server.registerTool('list_projects', { description: 'x' }, async (...a: unknown[]) => {
    seen = a
    return json([])
  })
  await registered.get('list_projects')!.handler(extra)
  assert.deepEqual(seen, [extra], 'a schema-less handler must not be handed a phantom args object')
  assert.deepEqual(records[0].params, [], 'and it has no parameter names to record')
})

test('a failing sink never breaks the tool call', async () => {
  const registered = new Map<string, (...a: unknown[]) => unknown>()
  const server = {
    registerTool(name: string, _c: unknown, handler: (...a: unknown[]) => unknown) {
      registered.set(name, handler)
      return { name }
    },
  }
  instrumentToolRegistration(server as unknown as McpServer, ctx, () => {
    throw new Error('DB is down')
  })
  server.registerTool('validate_board', { inputSchema: { projectId: z.string() } }, async () => json({ ok: true }))
  assert.deepEqual(await registered.get('validate_board')!({ projectId: 'p1' }, {}), json({ ok: true }))
})

test('every tool registered after instrumentation is wrapped, and the return value passes through', () => {
  const { server, registered } = fakeServer()
  for (const name of ['a', 'b', 'c']) {
    const handle = server.registerTool(name, { inputSchema: {} }, async () => json({}))
    assert.deepEqual(handle, { name }, 'registerTool still returns the SDK handle')
  }
  assert.deepEqual([...registered.keys()], ['a', 'b', 'c'])
})

test('against the real SDK: a schema-less and a schema-d tool both record one row, values excluded', async () => {
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js')
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
  const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js')

  const server = new McpServer({ name: 'test', version: '1.0.0' })
  const records: ToolCallRecord[] = []
  instrumentToolRegistration(server, ctx, (_c, rec) => records.push(rec))

  server.registerTool('list_projects', { description: 'no input schema' }, async () => json([{ id: 'p1' }]))
  server.registerTool(
    'create_snapshot',
    { inputSchema: { projectId: z.string(), name: z.string() } },
    async ({ name }) => json({ error: `create_snapshot refused while making ${name}` }),
  )

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

  const read = await client.callTool({ name: 'list_projects', arguments: {} })
  assert.deepEqual(read.content, json([{ id: 'p1' }]).content, 'the payload reaches the client unchanged')

  await client.callTool({ name: 'create_snapshot', arguments: { projectId: 'p1', name: 'v3 SECRET-RELEASE' } })

  assert.deepEqual(
    records.map((r) => [r.tool, r.outcome, r.params.join(','), r.projectId]),
    [
      ['list_projects', 'ok', '', null],
      ['create_snapshot', 'error', 'name,projectId', 'p1'],
    ],
  )
  assert.ok(!JSON.stringify(records).includes('SECRET-RELEASE'), 'no argument value reached a record')
  await client.close()
  await server.close()
})
