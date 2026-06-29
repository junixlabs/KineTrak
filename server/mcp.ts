import { randomUUID } from 'node:crypto'
import type { Express, Request, Response } from 'express'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { applyAndBroadcast, getRoot } from './state'
import { bearerFrom, verifyKey } from './keys'
import { findProject, searchBoard } from '../src/shared/board'
import { makeId, nextNodeCode } from '../src/store/ids'

const json = (obj: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] })
const dateLabel = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()} · ${p(d.getMonth() + 1)} · ${p(d.getDate())}`
}

const featureStatus = z.enum(['must', 'progress', 'done', 'nice'])
const nodeStatus = z.enum(['todo', 'progress', 'done', 'blocked'])
const nodeKind = z.enum(['start', 'process', 'decision', 'end'])

function buildMcpServer(orgId: string): McpServer {
  const server = new McpServer({ name: 'kinetrak', version: '1.0.0' })
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
    'update_module',
    { description: 'Update a module (name, color, owners, backbone column labels).', inputSchema: { projectId: z.string().optional(), id: z.string(), name: z.string().optional(), color: z.string().optional(), owners: z.array(z.string()).optional(), backboneName: z.string().optional(), backboneSub: z.string().optional() } },
    async ({ projectId, id, name, color, owners, backboneName, backboneSub }) => {
      const p = requireProj(projectId)
      const cur = p.data.modules.find((m) => m.id === id)
      if (!cur) return json({ error: 'module not found' })
      const patch: Record<string, unknown> = {}
      if (name !== undefined) patch.name = name
      if (color !== undefined) patch.color = color
      if (owners !== undefined) patch.owners = owners
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
function authorize(req: Request, res: Response): string | null {
  const key = verifyKey(bearerFrom(req.headers as Record<string, unknown>))
  if (key) return key.orgId
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
    const orgId = authorize(req, res)
    if (!orgId) return
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
      // Bind this session's tools to the org the key belongs to.
      await buildMcpServer(orgId).connect(transport)
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
