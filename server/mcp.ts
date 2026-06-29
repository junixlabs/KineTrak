import { randomUUID } from 'node:crypto'
import type { Express, Request, Response } from 'express'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { applyAndBroadcast as applyRaw, getRoot } from './state'
import { bearerFrom, verifyKey, type ApiKey } from './keys'
import { recordNote, listActivity, type Actor } from './activity'
import { findProject, searchBoard } from '../src/shared/board'
import { makeId, nextNodeCode } from '../src/store/ids'

const json = (obj: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] })
const dateLabel = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()} · ${p(d.getMonth() + 1)} · ${p(d.getDate())}`
}

// Node footprints (must match SwimlaneView's NODE_SIZE) for vertical centering.
const SWIM_NODE_H: Record<string, number> = { start: 46, end: 46, decision: 66, process: 58 }
const ARRANGE_BASE_X = 220
const ARRANGE_STEP_X = 210

/**
 * Tidy a swimlane: x by flow depth (longest path along edges), y centered in the
 * node's lane. Collisions in the same lane+depth bump to the next free column.
 * Returns the new positions; the caller dispatches the moves.
 */
function arrangeSwimlane(data: import('../src/shared/board').Root['projects'][number]['data']) {
  const { swimNodes, swimEdges, lanes } = data
  const ids = new Set(swimNodes.map((n) => n.id))
  const adj = new Map<string, string[]>()
  const indeg = new Map<string, number>()
  swimNodes.forEach((n) => { adj.set(n.id, []); indeg.set(n.id, 0) })
  swimEdges.forEach((e) => {
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) return
    adj.get(e.from)!.push(e.to)
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1)
  })
  // Longest-path depth via Kahn topological order (cycles fall back to depth 0).
  const depth = new Map<string, number>(swimNodes.map((n) => [n.id, 0]))
  const queue = swimNodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id)
  const deg = new Map(indeg)
  while (queue.length) {
    const u = queue.shift()!
    for (const v of adj.get(u) ?? []) {
      depth.set(v, Math.max(depth.get(v)!, depth.get(u)! + 1))
      deg.set(v, deg.get(v)! - 1)
      if (deg.get(v) === 0) queue.push(v)
    }
  }
  const used = new Set<string>()
  return swimNodes
    .slice()
    .sort((a, b) => depth.get(a.id)! - depth.get(b.id)!)
    .map((n) => {
      const lane = lanes.find((l) => l.id === n.lane)
      let d = depth.get(n.id)!
      while (used.has(`${n.lane}:${d}`)) d += 1
      used.add(`${n.lane}:${d}`)
      const h = SWIM_NODE_H[n.kind] ?? 58
      const y = lane ? Math.round(lane.y + (lane.h - h) / 2) : 80
      return { id: n.id, x: ARRANGE_BASE_X + d * ARRANGE_STEP_X, y }
    })
}

const featureStatus = z.enum(['must', 'progress', 'done', 'nice'])
const nodeStatus = z.enum(['todo', 'progress', 'done', 'blocked'])
const nodeKind = z.enum(['start', 'process', 'decision', 'end'])

function buildMcpServer(key: ApiKey): McpServer {
  const server = new McpServer({ name: 'kinetrak', version: '1.0.0' })
  const orgId = key.orgId
  const actor: Actor = { kind: 'agent', name: key.name }
  // Every agent mutation is attributed to this key in the activity log.
  const applyAndBroadcast = (cmd: Parameters<typeof applyRaw>[0]) => applyRaw(cmd, actor)
  // Scope every lookup to the key's org — the agent only ever sees that workspace.
  const orgProjects = () => getRoot().projects.filter((p) => p.orgId === orgId)
  const proj = (id?: string) => {
    const p = id ? findProject(getRoot(), id) : orgProjects()[0]
    return p && p.orgId === orgId ? p : undefined
  }
  const requireProj = (id?: string) => {
    const p = proj(id)
    if (!p) throw new Error('project not found in this workspace')
    return p
  }

  // ── Read / memory ──────────────────────────────────────────────────────────
  server.registerTool(
    'list_projects',
    { description: 'List all KineTrak projects with ids, org, and entity counts.' },
    async () =>
      json(
        orgProjects().map((p) => ({
          id: p.id,
          name: p.name,
          orgId: p.orgId,
          modules: p.data.modules.length,
          features: p.data.features.length,
          swimNodes: p.data.swimNodes.length,
          snapshots: p.snapshots.length,
        })),
      ),
  )

  server.registerTool(
    'get_board',
    { description: 'Read a project board as full structured context (modules, features, lanes, swimlane graph, releases). Use as memory/context.', inputSchema: { projectId: z.string().optional() } },
    async ({ projectId }) => {
      const p = proj(projectId)
      if (!p) return json({ error: 'project not found' })
      return json({ id: p.id, name: p.name, data: p.data, snapshots: p.snapshots.map((s) => ({ id: s.id, name: s.name, date: s.date })) })
    },
  )

  server.registerTool(
    'search',
    { description: 'Search the board (memory recall) across module/feature/step names, descriptions and constraints.', inputSchema: { query: z.string(), projectId: z.string().optional() } },
    async ({ query, projectId }) => {
      if (projectId && !proj(projectId)) return json({ error: 'project not found in this workspace' })
      const scoped = { orgs: [], projects: orgProjects() }
      return json(searchBoard(scoped, query, projectId))
    },
  )

  server.registerTool(
    'get_changes_since',
    {
      description:
        'Incremental recall — what changed on the board since a cursor, instead of re-reading the whole board. Returns activity entries (who/what/when) plus the current value of each changed entity, and a `cursor` to pass back next time. Omit `since` for the latest changes. Cheaper than get_board for staying in sync.',
      inputSchema: { projectId: z.string().optional(), since: z.number().optional() },
    },
    async ({ projectId, since }) => {
      const p = requireProj(projectId)
      const items = listActivity(p.id, since ?? 0, since === undefined ? 50 : 200)
      const d = p.data
      const entityOf = (id?: string) => {
        if (!id) return undefined
        const m = d.modules.find((x) => x.id === id)
        if (m) return { type: 'module', ...m }
        const f = d.features.find((x) => x.id === id)
        if (f) return { type: 'feature', ...f }
        const n = d.swimNodes.find((x) => x.id === id)
        if (n) return { type: 'swimnode', ...n }
        return { type: 'deleted', id }
      }
      const cursor = items.at(-1)?.ts ?? since ?? Date.now()
      return json({
        cursor,
        count: items.length,
        changes: items.map((a) => ({ ts: a.ts, actor: a.actor, kind: a.kind, summary: a.summary, target: entityOf(a.targetId) })),
      })
    },
  )

  server.registerTool(
    'validate_board',
    {
      description:
        "Self-check the board for structural problems you can't see visually: empty modules, orphan features, swim steps in missing lanes, edges to missing steps, disconnected steps, duplicate names. Returns issues by severity so you can fix them.",
      inputSchema: { projectId: z.string().optional() },
    },
    async ({ projectId }) => {
      const p = requireProj(projectId)
      const d = p.data
      const issues: { severity: 'error' | 'warning'; kind: string; message: string; ids?: string[] }[] = []
      const moduleIds = new Set(d.modules.map((m) => m.id))
      const laneIds = new Set(d.lanes.map((l) => l.id))
      const nodeIds = new Set(d.swimNodes.map((n) => n.id))

      d.modules.forEach((m) => {
        if (!d.features.some((f) => f.moduleId === m.id))
          issues.push({ severity: 'warning', kind: 'empty_module', message: `Module “${m.name}” has no features`, ids: [m.id] })
      })
      d.features.forEach((f) => {
        if (!moduleIds.has(f.moduleId)) issues.push({ severity: 'error', kind: 'orphan_feature', message: `Feature “${f.name}” points at a missing module`, ids: [f.id] })
      })
      d.swimNodes.forEach((n) => {
        if (!laneIds.has(n.lane)) issues.push({ severity: 'error', kind: 'node_bad_lane', message: `Step “${n.label}” is in a non-existent lane`, ids: [n.id] })
        const connected = d.swimEdges.some((e) => e.from === n.id || e.to === n.id)
        if (!connected && d.swimNodes.length > 1) issues.push({ severity: 'warning', kind: 'disconnected_step', message: `Step “${n.label}” has no connections`, ids: [n.id] })
      })
      d.swimEdges.forEach((e) => {
        if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) issues.push({ severity: 'error', kind: 'dangling_edge', message: `An edge references a missing step`, ids: [e.from, e.to] })
      })
      const dupNames = (names: string[]) => {
        const seen = new Set<string>()
        const dups = new Set<string>()
        names.forEach((n) => (seen.has(n.toLowerCase()) ? dups.add(n) : seen.add(n.toLowerCase())))
        return [...dups]
      }
      dupNames(d.modules.map((m) => m.name)).forEach((n) => issues.push({ severity: 'warning', kind: 'duplicate_module_name', message: `Duplicate module name “${n}”` }))

      return json({ ok: issues.every((i) => i.severity !== 'error'), errors: issues.filter((i) => i.severity === 'error').length, warnings: issues.filter((i) => i.severity === 'warning').length, issues })
    },
  )

  // ── Modules ─────────────────────────────────────────────────────────────────
  server.registerTool(
    'add_module',
    { description: 'Add a module (also a Story Map column).', inputSchema: { projectId: z.string().optional(), name: z.string().optional(), color: z.string().optional() } },
    async ({ projectId, name, color }) => {
      const p = requireProj(projectId)
      const id = makeId('m')
      applyAndBroadcast({ type: 'addModule', projectId: p.id, id, name, color })
      return json({ id })
    },
  )
  server.registerTool(
    'find_or_create_module',
    { description: 'Idempotent add: return the existing module with this name (case-insensitive) or create it. Safe to call when re-running a task. Returns {id, created}.', inputSchema: { projectId: z.string().optional(), name: z.string(), color: z.string().optional() } },
    async ({ projectId, name, color }) => {
      const p = requireProj(projectId)
      const found = p.data.modules.find((m) => m.name.trim().toLowerCase() === name.trim().toLowerCase())
      if (found) return json({ id: found.id, created: false })
      const id = makeId('m')
      applyAndBroadcast({ type: 'addModule', projectId: p.id, id, name, color })
      return json({ id, created: true })
    },
  )
  server.registerTool(
    'update_module',
    { description: 'Update a module (name, color, owners, backbone column labels, Mindmap side). side pins the Mindmap branch to "left"/"right" of the root; omit/null to auto-balance.', inputSchema: { projectId: z.string().optional(), id: z.string(), name: z.string().optional(), color: z.string().optional(), owners: z.array(z.string()).optional(), backboneName: z.string().optional(), backboneSub: z.string().optional(), side: z.enum(['left', 'right', 'auto']).optional() } },
    async ({ projectId, id, name, color, owners, backboneName, backboneSub, side }) => {
      const p = requireProj(projectId)
      const cur = p.data.modules.find((m) => m.id === id)
      if (!cur) return json({ error: 'module not found' })
      const patch: Record<string, unknown> = {}
      if (name !== undefined) patch.name = name
      if (color !== undefined) patch.color = color
      if (owners !== undefined) patch.owners = owners
      if (side !== undefined) patch.side = side === 'auto' ? undefined : side
      if (backboneName !== undefined || backboneSub !== undefined)
        patch.backbone = { name: backboneName ?? cur.backbone.name, sub: backboneSub ?? cur.backbone.sub }
      applyAndBroadcast({ type: 'updateModule', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_module',
    { description: 'Delete a module and its features.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'deleteModule', projectId: p.id, id })
      return json({ ok: true })
    },
  )

  // ── Features ────────────────────────────────────────────────────────────────
  server.registerTool(
    'add_feature',
    { description: 'Add a feature under a module (optionally in a release).', inputSchema: { projectId: z.string().optional(), moduleId: z.string(), releaseId: z.string().optional(), name: z.string().optional() } },
    async ({ projectId, moduleId, releaseId, name }) => {
      const p = requireProj(projectId)
      const rel = releaseId ?? p.data.releases[0]?.id
      if (!rel) return json({ error: 'no release available' })
      const id = makeId('f')
      applyAndBroadcast({ type: 'addFeature', projectId: p.id, id, moduleId, releaseId: rel, name })
      return json({ id })
    },
  )
  server.registerTool(
    'find_or_create_feature',
    { description: 'Idempotent add: return the existing feature with this name in the module (case-insensitive) or create it. Returns {id, created}.', inputSchema: { projectId: z.string().optional(), moduleId: z.string(), name: z.string(), releaseId: z.string().optional() } },
    async ({ projectId, moduleId, name, releaseId }) => {
      const p = requireProj(projectId)
      if (!p.data.modules.some((m) => m.id === moduleId)) return json({ error: 'module not found' })
      const found = p.data.features.find((f) => f.moduleId === moduleId && f.name.trim().toLowerCase() === name.trim().toLowerCase())
      if (found) return json({ id: found.id, created: false })
      const rel = releaseId ?? p.data.releases[0]?.id
      if (!rel) return json({ error: 'no release available' })
      const id = makeId('f')
      applyAndBroadcast({ type: 'addFeature', projectId: p.id, id, moduleId, releaseId: rel, name })
      return json({ id, created: true })
    },
  )
  server.registerTool(
    'update_feature',
    { description: 'Update a feature (name, status, module, release, description, constraints, validations).', inputSchema: { projectId: z.string().optional(), id: z.string(), name: z.string().optional(), status: featureStatus.optional(), moduleId: z.string().optional(), releaseId: z.string().optional(), desc: z.string().optional(), constraints: z.array(z.string()).optional(), validations: z.array(z.string()).optional() } },
    async ({ projectId, id, ...rest }) => {
      const p = requireProj(projectId)
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
      applyAndBroadcast({ type: 'updateFeature', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_feature',
    { description: 'Delete a feature.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'deleteFeature', projectId: p.id, id })
      return json({ ok: true })
    },
  )

  // ── Ordering (controls Mindmap / Story Map display order) ────────────────────
  server.registerTool(
    'reorder_modules',
    { description: 'Set the display order of modules (Mindmap branches / Story Map columns). Pass module ids in the desired order; any omitted keep their relative order at the end.', inputSchema: { projectId: z.string().optional(), orderedIds: z.array(z.string()) } },
    async ({ projectId, orderedIds }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'reorderModules', projectId: p.id, orderedIds })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'reorder_features',
    { description: 'Set the display order of features (top→bottom within their module on Mindmap / Story Map). Pass feature ids in the desired order; omitted ones keep their relative order at the end.', inputSchema: { projectId: z.string().optional(), orderedIds: z.array(z.string()) } },
    async ({ projectId, orderedIds }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'reorderFeatures', projectId: p.id, orderedIds })
      return json({ ok: true })
    },
  )

  // ── Swimlane nodes & edges ───────────────────────────────────────────────────
  server.registerTool(
    'add_swim_node',
    { description: 'Add a swimlane step to a lane (lane is the numeric lane id from get_board).', inputSchema: { projectId: z.string().optional(), lane: z.number().int(), label: z.string().optional(), kind: nodeKind.optional() } },
    async ({ projectId, lane, label, kind }) => {
      const p = requireProj(projectId)
      const d = p.data
      const code = nextNodeCode(d.swimNodes.map((n) => n.code))
      const count = d.swimNodes.filter((n) => n.lane === lane).length
      const laneObj = d.lanes.find((l) => l.id === lane)
      const x = 220 + count * 210
      const y = laneObj ? laneObj.y + (laneObj.h - 58) / 2 : 80
      const id = makeId('n')
      applyAndBroadcast({ type: 'addSwimNode', projectId: p.id, id, code, lane, x, y, label, kind })
      return json({ id, code })
    },
  )
  server.registerTool(
    'update_swim_node',
    { description: 'Update a swimlane step (label, status, kind, lane, owner, description, constraints).', inputSchema: { projectId: z.string().optional(), id: z.string(), label: z.string().optional(), status: nodeStatus.optional(), kind: nodeKind.optional(), lane: z.number().int().optional(), owner: z.string().optional(), desc: z.string().optional(), constraints: z.array(z.string()).optional() } },
    async ({ projectId, id, ...rest }) => {
      const p = requireProj(projectId)
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
      applyAndBroadcast({ type: 'updateSwimNode', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'move_swim_node',
    { description: 'Set a swimlane step\'s canvas position (x,y in px). Use to arrange the flow layout yourself.', inputSchema: { projectId: z.string().optional(), id: z.string(), x: z.number(), y: z.number() } },
    async ({ projectId, id, x, y }) => {
      const p = requireProj(projectId)
      if (!p.data.swimNodes.some((n) => n.id === id)) return json({ error: 'swim node not found' })
      applyAndBroadcast({ type: 'updateSwimNodePos', projectId: p.id, id, x: Math.round(x), y: Math.round(y) })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'arrange_swimlane',
    { description: 'Auto-tidy the swimlane: lay every step left→right by its flow depth (longest path along arrows) and vertically centered in its lane. One call cleans up the whole diagram.', inputSchema: { projectId: z.string().optional() } },
    async ({ projectId }) => {
      const p = requireProj(projectId)
      const placed = arrangeSwimlane(p.data)
      placed.forEach((n) => applyAndBroadcast({ type: 'updateSwimNodePos', projectId: p.id, id: n.id, x: n.x, y: n.y }))
      return json({ ok: true, moved: placed.length })
    },
  )
  server.registerTool(
    'delete_swim_node',
    { description: 'Delete a swimlane step and its connected edges.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'deleteSwimNode', projectId: p.id, id })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'add_swim_edge',
    { description: 'Connect two swimlane steps with an arrow (ids from get_board).', inputSchema: { projectId: z.string().optional(), from: z.string(), to: z.string(), branch: z.string().optional() } },
    async ({ projectId, from, to, branch }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'addSwimEdge', projectId: p.id, from, to, branch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_swim_edge',
    { description: 'Remove an arrow between two swimlane steps.', inputSchema: { projectId: z.string().optional(), from: z.string(), to: z.string() } },
    async ({ projectId, from, to }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'deleteSwimEdge', projectId: p.id, from, to })
      return json({ ok: true })
    },
  )

  // ── Snapshots & memory ───────────────────────────────────────────────────────
  server.registerTool(
    'create_snapshot',
    { description: 'Freeze the current board as a read-only snapshot.', inputSchema: { projectId: z.string().optional(), name: z.string() } },
    async ({ projectId, name }) => {
      const p = requireProj(projectId)
      const id = makeId('snap')
      applyAndBroadcast({ type: 'createSnapshot', projectId: p.id, id, name, date: dateLabel() })
      return json({ id })
    },
  )
  server.registerTool(
    'log_activity',
    { description: 'Narrate what you are doing or why, to the human watching the board. Appears in the live activity feed (not attached to any node). Use it to explain intent before/after a batch of edits.', inputSchema: { projectId: z.string().optional(), message: z.string() } },
    async ({ projectId, message }) => {
      const p = requireProj(projectId)
      recordNote(p.id, actor, message)
      return json({ ok: true })
    },
  )
  server.registerTool(
    'append_note',
    { description: 'Append a line of text to a feature or swimlane step description (memory write).', inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string(), text: z.string() } },
    async ({ projectId, target, id, text }) => {
      const p = requireProj(projectId)
      applyAndBroadcast({ type: 'appendNote', projectId: p.id, target, id, text })
      return json({ ok: true })
    },
  )

  return server
}

/**
 * Gate the MCP endpoint with a Bearer API key. Every request must carry a valid
 * key; the key resolves to a user + org and scopes all tools to that workspace.
 * Returns the key's orgId when authorized, or null after writing a 401.
 */
function authorize(req: Request, res: Response): ApiKey | null {
  const key = verifyKey(bearerFrom(req.headers as Record<string, unknown>))
  if (key) return key
  res.status(401).json({
    jsonrpc: '2.0',
    error: { code: -32001, message: 'Unauthorized — provide a valid KineTrak API key: "Authorization: Bearer <key>". Create one on the Connect page.' },
    id: null,
  })
  return null
}

/** Mount Streamable-HTTP MCP (stateful sessions) at /mcp. */
export function registerMcp(app: Express) {
  const transports: Record<string, StreamableHTTPServerTransport> = {}

  app.post('/mcp', async (req: Request, res: Response) => {
    const key = authorize(req, res)
    if (!key) return
    const sid = req.headers['mcp-session-id'] as string | undefined
    let transport = sid ? transports[sid] : undefined

    if (!transport) {
      if (!isInitializeRequest(req.body)) {
        res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'No valid session — send an initialize request first.' }, id: null })
        return
      }
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports[id] = transport!
        },
      })
      transport.onclose = () => {
        if (transport!.sessionId) delete transports[transport!.sessionId]
      }
      // Bind this session's tools to the key (org scope + activity attribution).
      await buildMcpServer(key).connect(transport)
    }

    await transport.handleRequest(req, res, req.body)
  })

  const bySession = async (req: Request, res: Response) => {
    if (!authorize(req, res)) return
    const sid = req.headers['mcp-session-id'] as string | undefined
    const transport = sid ? transports[sid] : undefined
    if (!transport) {
      res.status(400).send('Missing or unknown mcp-session-id')
      return
    }
    await transport.handleRequest(req, res)
  }
  app.get('/mcp', bySession) // SSE stream for server→client notifications
  app.delete('/mcp', bySession) // end session
}
