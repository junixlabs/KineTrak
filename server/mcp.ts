import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Express, Request, Response } from 'express'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { applyAndBroadcast as applyRaw, getCatalog, getProject, searchOrg } from './state'
import { bearerFrom, verifyKey, type ApiKey } from './keys'
import { recordNote, type Actor } from './activity'
import { activityRepo } from './infra/repositories'
import type { Project, WorkspaceSettings } from '../src/store/types'
import { makeId, nextNodeCode } from '../src/store/ids'
import { computeImpact } from '../src/lib/impact'
import { descStats, isSteeringFeature } from '../src/lib/descriptions'

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
function arrangeSwimlane(data: import('../src/shared/board').Root['projects'][number]['data'], flowId?: string) {
  const { swimEdges, lanes } = data
  // Scoped to one flow: arrange that flow's steps plus legacy unscoped steps (they show in every flow view).
  const swimNodes = flowId ? data.swimNodes.filter((n) => !n.flowId || n.flowId === flowId) : data.swimNodes
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

// Sent to every client on initialize — the condensed Layer-A playbook. The full
// process lives in docs/AGENT_PLAYBOOK.md; keep this in sync with it.
const SERVER_INSTRUCTIONS = `KineTrak is a live product/dev board you operate as your durable memory — the board is the single source of truth, not this chat. Full process: docs/AGENT_PLAYBOOK.md.

RECALL BEFORE YOU WRITE. Run the read path first every session: get_changes_since (incremental — pass back the cursor you stored last) or, on a cold start, get_board; then read the "Meta / Project Context" feature; then validate_board. Search before creating so you never duplicate (use find_or_create_module / find_or_create_feature). IDs are durable, names drift — resolve IDs fresh, never reuse one from a past session.

PER-FEATURE LIFECYCLE: write the spec (goal, non-goals, acceptance criteria) into the feature description → lay out an ordered swimlane (add_swim_node + add_swim_edge) → implement one step at a time, flipping each step's status and append_note-ing evidence → validate against the acceptance criteria → set the feature status to done and create_snapshot. Narrate non-trivial actions with log_activity so the watching human can follow.

EXISTING CODEBASE not yet on the board? Do NOT restructure. Scan the code with your own tools, draft an ADDITIVE map (find_or_create_module / find_or_create_feature) plus the "Project Context" node, then STOP for the human to confirm it, then create_snapshot("v0: as-is") before changing anything.

STOP AND GET HUMAN APPROVAL before any irreversible or high-blast-radius action: delete_module / delete_feature / delete_swim_node / delete_swim_edge, shipping a feature, restructuring many items at once, or creating/deleting a project. Gates are hard — do not bypass one because you judge it safe.

AT SESSION END, append_note your summary + next step + the latest cursor onto "Project Context", and snapshot if you did significant work.`

export function buildMcpServer(key: ApiKey): McpServer {
  const server = new McpServer({ name: 'kinetrak', version: '1.0.0' }, { instructions: SERVER_INSTRUCTIONS })
  const orgId = key.orgId
  const actor: Actor = { kind: 'agent', name: key.name }
  // Every agent mutation is attributed to this key in the activity log.
  const applyAndBroadcast = (cmd: Parameters<typeof applyRaw>[0]) => applyRaw(cmd, actor)
  // Scope every lookup to the key's org — the agent only ever sees that workspace.
  const orgHeaders = () => getCatalog().headers.filter((h) => h.orgId === orgId)
  const proj = async (id?: string): Promise<Project | undefined> => {
    const pid = id ?? orgHeaders()[0]?.id
    if (!pid) return undefined
    const h = getCatalog().headers.find((x) => x.id === pid)
    if (!h || h.orgId !== orgId) return undefined // outside this workspace
    return (await getProject(pid)) ?? undefined
  }
  const requireProj = async (id?: string): Promise<Project> => {
    const p = await proj(id)
    if (!p) throw new Error('project not found in this workspace')
    return p
  }
  /** Load every project in this org (used by list/search — heavier than a single get). */
  const orgProjects = async (): Promise<Project[]> =>
    (await Promise.all(orgHeaders().map((h) => getProject(h.id)))).filter((p): p is Project => !!p)

  // ── Read / memory ──────────────────────────────────────────────────────────
  server.registerTool(
    'list_projects',
    { description: 'List all KineTrak projects with ids, org, and entity counts.' },
    async () =>
      json(
        (await orgProjects()).map((p) => ({
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
    'create_project',
    {
      description:
        'Create a new project (board) in THIS workspace and return its id. Use when onboarding a codebase that has no board yet, or starting a new product — no need to open the web UI. template "blank" (default) = empty scaffold (standard lanes + releases); "sample" = demo content.',
      inputSchema: { name: z.string(), template: z.enum(['blank', 'sample']).optional() },
    },
    async ({ name, template }) => {
      const id = makeId('p')
      await applyAndBroadcast({ type: 'createProject', id, orgId, name, template: template ?? 'blank', createdAt: new Date().toISOString() })
      return json({ id, name, orgId })
    },
  )

  server.registerTool(
    'get_board',
    { description: 'Cold-start full read of a project board (modules, features, lanes, swimlane graph, releases). Use as memory/context. Once you have a cursor, prefer get_changes_since for cheaper incremental recall.', inputSchema: { projectId: z.string().optional() } },
    async ({ projectId }) => {
      const p = await proj(projectId)
      if (!p) return json({ error: 'project not found' })
      return json({ id: p.id, name: p.name, data: p.data, snapshots: p.snapshots.map((s) => ({ id: s.id, name: s.name, date: s.date })) })
    },
  )

  server.registerTool(
    'search',
    { description: 'Search the board (memory recall) across module/feature/step names, descriptions and constraints.', inputSchema: { query: z.string(), projectId: z.string().optional() } },
    async ({ query, projectId }) => {
      if (projectId && !(await proj(projectId))) return json({ error: 'project not found in this workspace' })
      // Pg: SQL over the search projection; File: in-RAM scan. No board loaded in Pg mode.
      return json(await searchOrg(orgId, query, projectId))
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
      const p = await requireProj(projectId)
      // DB-backed cursor read (bigserial id). Unlike the bounded RAM ring, this
      // never drops a project's entries when other projects are busy. Omit `since`
      // → newest entries; otherwise everything strictly after the cursor.
      const items =
        since === undefined ? await activityRepo.latest(p.id, 50) : await activityRepo.since(p.id, since, 200)
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
      // Cursor is the last entry's bigserial id; if nothing new, keep the caller's.
      const cursor = items.length ? Number(items.at(-1)!.id) : (since ?? 0)
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
      const p = await requireProj(projectId)
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
      const featById = new Map(d.features.map((f) => [f.id, f]))
      d.features.forEach((f) => {
        if (!f.parentId) return
        const parent = featById.get(f.parentId)
        if (!parent) issues.push({ severity: 'warning', kind: 'missing_parent', message: `Sub-feature “${f.name}” points at a missing parent`, ids: [f.id] })
        else if (f.parentId === f.id) issues.push({ severity: 'error', kind: 'nested_parent', message: `Feature “${f.name}” is its own parent`, ids: [f.id] })
        else if (parent.moduleId !== f.moduleId) issues.push({ severity: 'error', kind: 'cross_module_parent', message: `Sub-feature “${f.name}” has its parent in another module`, ids: [f.id, parent.id] })
        else if (parent.parentId) issues.push({ severity: 'error', kind: 'nested_parent', message: `Sub-feature “${f.name}” nests deeper than one level (parent “${parent.name}” is itself a sub-feature)`, ids: [f.id, parent.id] })
      })
      d.swimNodes.forEach((n) => {
        if (!laneIds.has(n.lane)) issues.push({ severity: 'error', kind: 'node_bad_lane', message: `Step “${n.label}” is in a non-existent lane`, ids: [n.id] })
        const connected = d.swimEdges.some((e) => e.from === n.id || e.to === n.id)
        if (!connected && d.swimNodes.length > 1) issues.push({ severity: 'warning', kind: 'disconnected_step', message: `Step “${n.label}” has no connections`, ids: [n.id] })
      })
      d.swimEdges.forEach((e) => {
        if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) issues.push({ severity: 'error', kind: 'dangling_edge', message: `An edge references a missing step`, ids: [e.from, e.to] })
      })
      const featIds = new Set(d.features.map((f) => f.id))
      const nodeById = new Map(d.swimNodes.map((n) => [n.id, n]))
      d.swimNodes.forEach((n) => {
        if (n.flowId && !featIds.has(n.flowId))
          issues.push({ severity: 'warning', kind: 'dangling_flow', message: `Step “${n.label}” belongs to a flow whose feature no longer exists`, ids: [n.id] })
      })
      d.swimEdges.forEach((e) => {
        const a = nodeById.get(e.from)
        const b = nodeById.get(e.to)
        if (a?.flowId && b?.flowId && a.flowId !== b.flowId)
          issues.push({ severity: 'warning', kind: 'cross_flow_edge', message: `Edge “${a.label}” → “${b.label}” crosses two flows — steps of one flow should connect within it`, ids: [e.from, e.to] })
      })
      const dupNames = (names: string[]) => {
        const seen = new Set<string>()
        const dups = new Set<string>()
        names.forEach((n) => (seen.has(n.toLowerCase()) ? dups.add(n) : seen.add(n.toLowerCase())))
        return [...dups]
      }
      dupNames(d.modules.map((m) => m.name)).forEach((n) => issues.push({ severity: 'warning', kind: 'duplicate_module_name', message: `Duplicate module name “${n}”` }))
      const ctxId = d.settings?.contextFeatureId
      if (ctxId && !d.features.some((f) => f.id === ctxId))
        issues.push({ severity: 'warning', kind: 'dangling_context_pointer', message: 'settings.contextFeatureId points at a missing feature — fix the board contract (update_settings)', ids: [ctxId] })

      // Description-contract budget (see AGENT_PLAYBOOK §1.6): flag rambling descriptions to compact.
      // The Meta/Project Context steering node is exempt from the char/line budget.
      const moduleName = new Map(d.modules.map((m) => [m.id, m.name]))
      d.features.forEach((f) => {
        if (isSteeringFeature(f, moduleName.get(f.moduleId), d.settings?.contextFeatureId)) return
        const s = descStats(f.desc)
        if (s.overBudget) issues.push({ severity: 'warning', kind: 'bloated_description', message: `Feature “${f.name}” description over budget — ${s.reasons.join('; ')}`, ids: [f.id] })
      })
      d.swimNodes.forEach((n) => {
        const s = descStats(n.desc)
        if (s.overBudget) issues.push({ severity: 'warning', kind: 'bloated_description', message: `Step “${n.label}” description over budget — ${s.reasons.join('; ')}`, ids: [n.id] })
      })

      return json({ ok: issues.every((i) => i.severity !== 'error'), errors: issues.filter((i) => i.severity === 'error').length, warnings: issues.filter((i) => i.severity === 'warning').length, issues })
    },
  )

  server.registerTool(
    'next_action',
    {
      description:
        'The "where am I?" primitive — read the board\'s current state and get the recommended next lifecycle step, plus the latest activity `cursor` for incremental recall. Cheap orientation when resuming work; pair with get_changes_since(cursor).',
      inputSchema: { projectId: z.string().optional() },
    },
    async ({ projectId }) => {
      const p = await proj(projectId)
      if (!p) return json({ error: 'project not found in this workspace' })
      const d = p.data
      const latest = await activityRepo.latest(p.id, 1)
      const cursor = latest.length ? Number(latest[0].id) : 0

      const norm = (s: string) => s.trim().toLowerCase()
      const ctxId = d.settings?.contextFeatureId
      const hasContext = ctxId
        ? d.features.some((f) => f.id === ctxId)
        : d.modules.some((m) => norm(m.name) === 'meta') && d.features.some((f) => norm(f.name) === 'project context')
      const blocked = d.swimNodes.filter((n) => n.status === 'blocked')
      const inProgress = d.features.filter((f) => f.status === 'progress')
      const planned = d.features.filter((f) => f.status === 'must')
      const moduleIds = new Set(d.modules.map((m) => m.id))
      const laneIds = new Set(d.lanes.map((l) => l.id))
      const structuralIssues =
        d.features.filter((f) => !moduleIds.has(f.moduleId)).length +
        d.swimNodes.filter((n) => !laneIds.has(n.lane)).length
      const names = (xs: { name?: string; label?: string }[]) =>
        xs.slice(0, 3).map((x) => `“${x.name ?? x.label}”`).join(', ')

      let suggestion: string
      let suggestedSkill: string
      if (!hasContext) {
        suggestion = 'No “Meta / Project Context” node — capture the project domain, stack and conventions there (onboard an existing codebase, or seed it for a new one).'
        suggestedSkill = 'kinetrak-onboard'
      } else if (structuralIssues > 0) {
        suggestion = `${structuralIssues} structural issue(s) on the board — run validate_board and fix before starting new work.`
        suggestedSkill = 'kinetrak-validate'
      } else if (blocked.length) {
        suggestion = `${blocked.length} swim step(s) blocked — resolve the blocker(s): ${names(blocked)}.`
        suggestedSkill = 'kinetrak-implement'
      } else if (inProgress.length) {
        suggestion = `Continue in-progress feature(s): ${names(inProgress)}.`
        suggestedSkill = 'kinetrak-implement'
      } else if (planned.length) {
        suggestion = `Start a committed (must) feature: ${names(planned)} — specify, then decompose.`
        suggestedSkill = 'kinetrak-specify'
      } else {
        suggestion = 'No committed work pending — pick the next feature to specify, or ship/close out the session.'
        suggestedSkill = 'kinetrak-specify'
      }

      return json({
        projectId: p.id,
        cursor,
        boardContract: {
          role: d.settings?.boardRole ?? null,
          truthPointers: d.settings?.truthPointers ?? [],
          contextFeatureId: ctxId ?? null,
        },
        summary: {
          modules: d.modules.length,
          features: d.features.length,
          swimNodes: d.swimNodes.length,
          featuresByStatus: {
            must: planned.length,
            progress: inProgress.length,
            done: d.features.filter((f) => f.status === 'done').length,
            nice: d.features.filter((f) => f.status === 'nice').length,
          },
          blockedSteps: blocked.length,
          structuralIssues,
          hasProjectContext: hasContext,
        },
        suggestion,
        suggestedSkill,
      })
    },
  )

  server.registerTool(
    'compute_impact',
    {
      description:
        'Compute the cross-view impact zone of a feature or swim step: from its swimlane entry node(s), every downstream step plus the lanes and other features touched. Pass a feature id or a swim-node id as `focusId`.',
      inputSchema: { projectId: z.string().optional(), focusId: z.string() },
    },
    async ({ projectId, focusId }) => {
      const p = await requireProj(projectId)
      return json(computeImpact(p.data, focusId))
    },
  )
  server.registerTool(
    'set_impact_threshold',
    {
      description:
        'Set the per-project impact sensitivity: the minimum downstream-step footprint for a linked feature to raise an impact alert (default 3).',
      inputSchema: { projectId: z.string().optional(), threshold: z.number().int().min(1) },
    },
    async ({ projectId, threshold }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'updateSettings', projectId: p.id, patch: { impactThreshold: threshold } })
      return json({ ok: true, impactThreshold: threshold })
    },
  )
  server.registerTool(
    'update_settings',
    {
      description:
        'Set the per-project board contract so agents auto-orient instead of parsing Project Context prose: boardRole (ssot = this board is the operational source of truth · map = derived view, verify against truthPointers before acting · asis-doc = as-built snapshot, statuses mean "exists" not "shipped"), truthPointers (where truth lives when the board is not it, e.g. Forge/git), contextFeatureId (pin the steering Project Context feature by id — exempts it from the desc budget regardless of name).',
      inputSchema: {
        projectId: z.string().optional(),
        boardRole: z.enum(['ssot', 'map', 'asis-doc']).optional(),
        truthPointers: z.array(z.object({ name: z.string(), url: z.string().optional() })).optional(),
        contextFeatureId: z.string().optional(),
      },
    },
    async ({ projectId, boardRole, truthPointers, contextFeatureId }) => {
      const p = await requireProj(projectId)
      if (contextFeatureId && !p.data.features.some((f) => f.id === contextFeatureId))
        return json({ error: 'contextFeatureId does not reference a feature on this board' })
      const patch: Partial<WorkspaceSettings> = {}
      if (boardRole !== undefined) patch.boardRole = boardRole
      if (truthPointers !== undefined) patch.truthPointers = truthPointers
      if (contextFeatureId !== undefined) patch.contextFeatureId = contextFeatureId
      if (!Object.keys(patch).length) return json({ error: 'nothing to update — pass boardRole, truthPointers and/or contextFeatureId' })
      await applyAndBroadcast({ type: 'updateSettings', projectId: p.id, patch })
      return json({ ok: true, settings: { ...p.data.settings, ...patch } })
    },
  )

  // ── Business-logic SSOT: links, code refs, dependencies, acceptance ──────────
  server.registerTool(
    'link_feature_step',
    {
      description:
        'Link a feature to the swimlane step that implements it (traceability + the input the impact engine walks). Creates a bidirectional crossLink. Call this in DECOMPOSE for every step so compute_impact can resolve a feature to its swimlane entry node.',
      inputSchema: { projectId: z.string().optional(), featureId: z.string(), nodeId: z.string() },
    },
    async ({ projectId, featureId, nodeId }) => {
      const p = await requireProj(projectId)
      if (!p.data.features.some((f) => f.id === featureId)) return json({ error: 'feature not found' })
      if (!p.data.swimNodes.some((n) => n.id === nodeId)) return json({ error: 'swim node not found' })
      await applyAndBroadcast({ type: 'linkFeatureStep', projectId: p.id, featureId, nodeId, op: 'link' })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'unlink_feature_step',
    { description: 'Remove the crossLink between a feature and a swimlane step.', inputSchema: { projectId: z.string().optional(), featureId: z.string(), nodeId: z.string() } },
    async ({ projectId, featureId, nodeId }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'linkFeatureStep', projectId: p.id, featureId, nodeId, op: 'unlink' })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'link_code',
    {
      description:
        'Attach a code reference (repo path, optional symbol/url/sha) to a feature or step. This is what makes the board a source of truth for BUSINESS LOGIC: linked code is what a VCS webhook watches to flag the node outdated when it changes. Re-linking clears any outdated flag (= reconciled).',
      inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string(), path: z.string(), symbol: z.string().optional(), url: z.string().optional(), sha: z.string().optional() },
    },
    async ({ projectId, target, id, path, symbol, url, sha }) => {
      const p = await requireProj(projectId)
      const ref = { path, ...(symbol ? { symbol } : {}), ...(url ? { url } : {}), ...(sha ? { sha } : {}) }
      await applyAndBroadcast({ type: 'linkCode', projectId: p.id, target, id, ref, op: 'link' })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'unlink_code',
    { description: 'Remove a code reference (matched by path + symbol) from a feature or step.', inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string(), path: z.string(), symbol: z.string().optional() } },
    async ({ projectId, target, id, path, symbol }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'linkCode', projectId: p.id, target, id, ref: { path, ...(symbol ? { symbol } : {}) }, op: 'unlink' })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'resolve_outdated',
    { description: 'Clear the "outdated" flag on a feature/step after you have re-checked its spec against the changed code (reconciled). Dismisses the derived outdated alert.', inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string() } },
    async ({ projectId, target, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'markCodeStale', projectId: p.id, targets: [{ target, id }], stale: false })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'add_dependency',
    { description: 'Declare that a feature depends on another feature. Changing the depended-on feature then ripples up: compute_impact reports this feature as affected. Cycles/self-links are ignored.', inputSchema: { projectId: z.string().optional(), featureId: z.string(), dependsOnId: z.string() } },
    async ({ projectId, featureId, dependsOnId }) => {
      const p = await requireProj(projectId)
      if (!p.data.features.some((f) => f.id === featureId) || !p.data.features.some((f) => f.id === dependsOnId)) return json({ error: 'feature not found' })
      await applyAndBroadcast({ type: 'setDependency', projectId: p.id, featureId, dependsOnId, op: 'add' })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'remove_dependency',
    { description: 'Remove a feature→feature dependency.', inputSchema: { projectId: z.string().optional(), featureId: z.string(), dependsOnId: z.string() } },
    async ({ projectId, featureId, dependsOnId }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'setDependency', projectId: p.id, featureId, dependsOnId, op: 'remove' })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'set_acceptance',
    { description: 'Set the acceptance-criteria checklist (definition of done) on a feature or step, replacing any existing list. Committed features with unmet criteria raise a live "Definition of Done" alert and cannot be shipped.', inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string(), items: z.array(z.string()) } },
    async ({ projectId, target, id, items }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'setAcceptance', projectId: p.id, target, id, items })
      return json({ ok: true, count: items.length })
    },
  )
  server.registerTool(
    'check_acceptance',
    { description: 'Check off (or uncheck) one acceptance criterion by its index in the checklist. Use in VALIDATE to tick each criterion you verified — the board tracks done/total structurally, not just as a note.', inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string(), index: z.number().int().min(0), done: z.boolean() } },
    async ({ projectId, target, id, index, done }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'checkAcceptance', projectId: p.id, target, id, index, done })
      return json({ ok: true })
    },
  )

  // ── Lanes & releases (roadmap authoring) ─────────────────────────────────────
  server.registerTool(
    'add_lane',
    { description: 'Add a swimlane responsibility band (lane). Returns the new numeric lane id to use with add_swim_node.', inputSchema: { projectId: z.string().optional(), name: z.string().optional() } },
    async ({ projectId, name }) => {
      const p = await requireProj(projectId)
      const id = (p.data.lanes.reduce((m, l) => Math.max(m, l.id), -1) + 1)
      await applyAndBroadcast({ type: 'addLane', projectId: p.id, id, name })
      return json({ id })
    },
  )
  server.registerTool(
    'update_lane',
    { description: 'Update a lane (name, sub, color).', inputSchema: { projectId: z.string().optional(), id: z.number().int(), name: z.string().optional(), sub: z.string().optional(), color: z.string().optional() } },
    async ({ projectId, id, ...rest }) => {
      const p = await requireProj(projectId)
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
      await applyAndBroadcast({ type: 'updateLane', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_lane',
    { description: 'Delete a lane; its steps are reassigned to the first remaining lane (never orphaned). Tier 4 — confirm with the human first.', inputSchema: { projectId: z.string().optional(), id: z.number().int() } },
    async ({ projectId, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'deleteLane', projectId: p.id, id })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'add_release',
    { description: 'Add a release (Story Map row / roadmap milestone). Returns the new release id.', inputSchema: { projectId: z.string().optional(), name: z.string().optional() } },
    async ({ projectId, name }) => {
      const p = await requireProj(projectId)
      const id = makeId('rel')
      await applyAndBroadcast({ type: 'addRelease', projectId: p.id, id, name })
      return json({ id })
    },
  )
  server.registerTool(
    'update_release',
    { description: 'Update a release (name, tag, colors).', inputSchema: { projectId: z.string().optional(), id: z.string(), name: z.string().optional(), tag: z.string().optional(), color: z.string().optional() } },
    async ({ projectId, id, ...rest }) => {
      const p = await requireProj(projectId)
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
      await applyAndBroadcast({ type: 'updateRelease', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_release',
    { description: 'Delete a release; its features are reassigned to the first remaining release. Tier 4 — confirm with the human first.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'deleteRelease', projectId: p.id, id })
      return json({ ok: true })
    },
  )

  // ── Async human-decision channel ─────────────────────────────────────────────
  server.registerTool(
    'ask_human',
    {
      description:
        'Raise a decision the human must make (a structured, two-way alternative to the one-way log_activity). Creates a pending "question" alert on the board; the human answers it in the UI (or via answer_question). Poll get_changes_since / get_board to read the answer before proceeding. Use it at a Tier-4 gate instead of guessing.',
      inputSchema: { projectId: z.string().optional(), question: z.string(), nodeId: z.string().optional(), view: z.enum(['mindmap', 'story', 'swimlane']).optional(), options: z.array(z.string()).optional() },
    },
    async ({ projectId, question, nodeId, view, options }) => {
      const p = await requireProj(projectId)
      const id = makeId('q')
      await applyAndBroadcast({ type: 'askHuman', projectId: p.id, id, question, nodeId, view, options })
      return json({ id, status: 'pending' })
    },
  )
  server.registerTool(
    'answer_question',
    { description: 'Record an answer to a pending "question" alert (the human decision). Usually the human answers in the UI; an agent may relay a captured answer here.', inputSchema: { projectId: z.string().optional(), id: z.string(), answer: z.string() } },
    async ({ projectId, id, answer }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'answerQuestion', projectId: p.id, id, answer })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'resolve_question',
    { description: 'Dismiss a "question" alert once its decision has been acted on.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'resolveQuestion', projectId: p.id, id })
      return json({ ok: true })
    },
  )

  // ── Modules ─────────────────────────────────────────────────────────────────
  server.registerTool(
    'add_module',
    { description: 'Add a module (also a Story Map column).', inputSchema: { projectId: z.string().optional(), name: z.string().optional(), color: z.string().optional() } },
    async ({ projectId, name, color }) => {
      const p = await requireProj(projectId)
      const id = makeId('m')
      await applyAndBroadcast({ type: 'addModule', projectId: p.id, id, name, color })
      return json({ id })
    },
  )
  server.registerTool(
    'find_or_create_module',
    { description: 'Idempotent add: return the existing module with this name (case-insensitive) or create it. Safe to call when re-running a task. Returns {id, created}.', inputSchema: { projectId: z.string().optional(), name: z.string(), color: z.string().optional() } },
    async ({ projectId, name, color }) => {
      const p = await requireProj(projectId)
      const found = p.data.modules.find((m) => m.name.trim().toLowerCase() === name.trim().toLowerCase())
      if (found) return json({ id: found.id, created: false })
      const id = makeId('m')
      await applyAndBroadcast({ type: 'addModule', projectId: p.id, id, name, color })
      return json({ id, created: true })
    },
  )
  server.registerTool(
    'update_module',
    { description: 'Update a module (name, color, owners, backbone column labels, Mindmap side). side pins the Mindmap branch to "left"/"right" of the root; omit/null to auto-balance.', inputSchema: { projectId: z.string().optional(), id: z.string(), name: z.string().optional(), color: z.string().optional(), owners: z.array(z.string()).optional(), backboneName: z.string().optional(), backboneSub: z.string().optional(), side: z.enum(['left', 'right', 'auto']).optional() } },
    async ({ projectId, id, name, color, owners, backboneName, backboneSub, side }) => {
      const p = await requireProj(projectId)
      const cur = p.data.modules.find((m) => m.id === id)
      if (!cur) return json({ error: 'module not found' })
      const patch: Record<string, unknown> = {}
      if (name !== undefined) patch.name = name
      if (color !== undefined) patch.color = color
      if (owners !== undefined) patch.owners = owners
      if (side !== undefined) patch.side = side === 'auto' ? undefined : side
      if (backboneName !== undefined || backboneSub !== undefined)
        patch.backbone = { name: backboneName ?? cur.backbone.name, sub: backboneSub ?? cur.backbone.sub }
      await applyAndBroadcast({ type: 'updateModule', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_module',
    { description: 'Delete a module and its features. Tier 4 — irreversible; confirm with the human before calling unless already authorized. Snapshot first.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'deleteModule', projectId: p.id, id })
      return json({ ok: true })
    },
  )

  // ── Features ────────────────────────────────────────────────────────────────
  server.registerTool(
    'add_feature',
    { description: 'Add a feature under a module (optionally in a release).', inputSchema: { projectId: z.string().optional(), moduleId: z.string(), releaseId: z.string().optional(), name: z.string().optional() } },
    async ({ projectId, moduleId, releaseId, name }) => {
      const p = await requireProj(projectId)
      const rel = releaseId ?? p.data.releases[0]?.id
      if (!rel) return json({ error: 'no release available' })
      const id = makeId('f')
      await applyAndBroadcast({ type: 'addFeature', projectId: p.id, id, moduleId, releaseId: rel, name })
      return json({ id })
    },
  )
  server.registerTool(
    'find_or_create_feature',
    { description: 'Idempotent add: return the existing feature with this name in the module (case-insensitive) or create it. Returns {id, created}.', inputSchema: { projectId: z.string().optional(), moduleId: z.string(), name: z.string(), releaseId: z.string().optional() } },
    async ({ projectId, moduleId, name, releaseId }) => {
      const p = await requireProj(projectId)
      if (!p.data.modules.some((m) => m.id === moduleId)) return json({ error: 'module not found' })
      const found = p.data.features.find((f) => f.moduleId === moduleId && f.name.trim().toLowerCase() === name.trim().toLowerCase())
      if (found) return json({ id: found.id, created: false })
      const rel = releaseId ?? p.data.releases[0]?.id
      if (!rel) return json({ error: 'no release available' })
      const id = makeId('f')
      await applyAndBroadcast({ type: 'addFeature', projectId: p.id, id, moduleId, releaseId: rel, name })
      return json({ id, created: true })
    },
  )
  server.registerTool(
    'update_feature',
    { description: 'Update a feature (name, status, module, release, description, constraints, validations, parentId). This is where the SPEC lives — put the goal, non-goals, constraints and acceptance criteria in desc before implementing. Status: must/nice = planned, progress = in progress, done = shipped. parentId nests the feature one level under a parent in the same module (epic → sub-feature); pass "" to promote it back to top level.', inputSchema: { projectId: z.string().optional(), id: z.string(), name: z.string().optional(), status: featureStatus.optional(), moduleId: z.string().optional(), releaseId: z.string().optional(), desc: z.string().optional(), constraints: z.array(z.string()).optional(), validations: z.array(z.string()).optional(), parentId: z.string().optional() } },
    async ({ projectId, id, parentId, ...rest }) => {
      const p = await requireProj(projectId)
      if (parentId) {
        const self = p.data.features.find((f) => f.id === id)
        const parent = p.data.features.find((f) => f.id === parentId)
        if (!self) return json({ error: 'feature not found' })
        if (!parent) return json({ error: 'parentId does not reference a feature on this board' })
        if (parentId === id) return json({ error: 'a feature cannot be its own parent' })
        const targetModule = (rest.moduleId as string | undefined) ?? self.moduleId
        if (parent.moduleId !== targetModule) return json({ error: 'parent must be in the same module' })
        if (parent.parentId) return json({ error: 'parent is itself a sub-feature — only one nesting level is allowed' })
        if (p.data.features.some((f) => f.parentId === id)) return json({ error: 'this feature has sub-features of its own — promote them first (one nesting level)' })
      }
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
      if (parentId !== undefined) patch.parentId = parentId === '' ? undefined : parentId
      await applyAndBroadcast({ type: 'updateFeature', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_feature',
    { description: 'Delete a feature. Tier 4 — irreversible; confirm with the human before calling unless already authorized.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'deleteFeature', projectId: p.id, id })
      return json({ ok: true })
    },
  )

  // ── Ordering (controls Mindmap / Story Map display order) ────────────────────
  server.registerTool(
    'reorder_modules',
    { description: 'Set the display order of modules (Mindmap branches / Story Map columns). Pass module ids in the desired order; any omitted keep their relative order at the end.', inputSchema: { projectId: z.string().optional(), orderedIds: z.array(z.string()) } },
    async ({ projectId, orderedIds }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'reorderModules', projectId: p.id, orderedIds })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'reorder_features',
    { description: 'Set the display order of features (top→bottom within their module on Mindmap / Story Map). Pass feature ids in the desired order; omitted ones keep their relative order at the end.', inputSchema: { projectId: z.string().optional(), orderedIds: z.array(z.string()) } },
    async ({ projectId, orderedIds }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'reorderFeatures', projectId: p.id, orderedIds })
      return json({ ok: true })
    },
  )

  // ── Swimlane nodes & edges ───────────────────────────────────────────────────
  server.registerTool(
    'add_swim_node',
    { description: 'Add a swimlane step to a lane (lane is the numeric lane id from get_board). Pass flowId (the owning feature id) to scope the step to that feature\'s flow — the UI can then filter the canvas to one flow; omit for the legacy shared canvas.', inputSchema: { projectId: z.string().optional(), lane: z.number().int(), label: z.string().optional(), kind: nodeKind.optional(), flowId: z.string().optional() } },
    async ({ projectId, lane, label, kind, flowId }) => {
      const p = await requireProj(projectId)
      const d = p.data
      if (flowId && !d.features.some((f) => f.id === flowId)) return json({ error: 'flowId does not reference a feature on this board' })
      const code = nextNodeCode(d.swimNodes.map((n) => n.code))
      const count = d.swimNodes.filter((n) => n.lane === lane && (!flowId || n.flowId === flowId)).length
      const laneObj = d.lanes.find((l) => l.id === lane)
      const x = 220 + count * 210
      const y = laneObj ? laneObj.y + (laneObj.h - 58) / 2 : 80
      const id = makeId('n')
      await applyAndBroadcast({ type: 'addSwimNode', projectId: p.id, id, code, lane, x, y, label, kind, flowId })
      return json({ id, code })
    },
  )
  server.registerTool(
    'update_swim_node',
    { description: 'Update a swimlane step (label, status, kind, lane, owner, description, constraints, flowId). flowId scopes the step to a feature\'s flow — pass "" to un-scope it back to the shared canvas.', inputSchema: { projectId: z.string().optional(), id: z.string(), label: z.string().optional(), status: nodeStatus.optional(), kind: nodeKind.optional(), lane: z.number().int().optional(), owner: z.string().optional(), desc: z.string().optional(), constraints: z.array(z.string()).optional(), flowId: z.string().optional() } },
    async ({ projectId, id, flowId, ...rest }) => {
      const p = await requireProj(projectId)
      if (flowId && !p.data.features.some((f) => f.id === flowId)) return json({ error: 'flowId does not reference a feature on this board' })
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
      if (flowId !== undefined) patch.flowId = flowId === '' ? undefined : flowId
      await applyAndBroadcast({ type: 'updateSwimNode', projectId: p.id, id, patch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'move_swim_node',
    { description: 'Set a swimlane step\'s canvas position (x,y in px). Use to arrange the flow layout yourself.', inputSchema: { projectId: z.string().optional(), id: z.string(), x: z.number(), y: z.number() } },
    async ({ projectId, id, x, y }) => {
      const p = await requireProj(projectId)
      if (!p.data.swimNodes.some((n) => n.id === id)) return json({ error: 'swim node not found' })
      await applyAndBroadcast({ type: 'updateSwimNodePos', projectId: p.id, id, x: Math.round(x), y: Math.round(y) })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'arrange_swimlane',
    { description: 'Auto-tidy the swimlane: lay every step left→right by its flow depth (longest path along arrows) and vertically centered in its lane. One call cleans up the whole diagram. Pass flowId to arrange only that feature\'s flow (plus legacy unscoped steps).', inputSchema: { projectId: z.string().optional(), flowId: z.string().optional() } },
    async ({ projectId, flowId }) => {
      const p = await requireProj(projectId)
      const placed = arrangeSwimlane(p.data, flowId)
      for (const n of placed) await applyAndBroadcast({ type: 'updateSwimNodePos', projectId: p.id, id: n.id, x: n.x, y: n.y })
      return json({ ok: true, moved: placed.length })
    },
  )
  server.registerTool(
    'delete_swim_node',
    { description: 'Delete a swimlane step and its connected edges. Tier 4 — irreversible; confirm with the human before calling unless already authorized.', inputSchema: { projectId: z.string().optional(), id: z.string() } },
    async ({ projectId, id }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'deleteSwimNode', projectId: p.id, id })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'add_swim_edge',
    { description: 'Connect two swimlane steps with an arrow (ids from get_board).', inputSchema: { projectId: z.string().optional(), from: z.string(), to: z.string(), branch: z.string().optional() } },
    async ({ projectId, from, to, branch }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'addSwimEdge', projectId: p.id, from, to, branch })
      return json({ ok: true })
    },
  )
  server.registerTool(
    'delete_swim_edge',
    { description: 'Remove an arrow between two swimlane steps. Tier 4 — confirm with the human before calling unless already authorized.', inputSchema: { projectId: z.string().optional(), from: z.string(), to: z.string() } },
    async ({ projectId, from, to }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'deleteSwimEdge', projectId: p.id, from, to })
      return json({ ok: true })
    },
  )

  // ── Snapshots & memory ───────────────────────────────────────────────────────
  server.registerTool(
    'create_snapshot',
    { description: 'Freeze the current board as a read-only snapshot — your undo point. Take one before any wide or destructive batch, and when shipping. Name it with a version + what changed, e.g. "v3: checkout flow shipped".', inputSchema: { projectId: z.string().optional(), name: z.string() } },
    async ({ projectId, name }) => {
      const p = await requireProj(projectId)
      const id = makeId('snap')
      await applyAndBroadcast({ type: 'createSnapshot', projectId: p.id, id, name, date: dateLabel() })
      return json({ id })
    },
  )
  server.registerTool(
    'log_activity',
    { description: 'Narrate what you are doing or why, to the human watching the board. Appears in the live activity feed (not attached to any node). Use it to explain intent before/after a batch of edits.', inputSchema: { projectId: z.string().optional(), message: z.string() } },
    async ({ projectId, message }) => {
      const p = await requireProj(projectId)
      recordNote(p.id, actor, message)
      return json({ ok: true })
    },
  )
  server.registerTool(
    'append_note',
    { description: 'Append a line of text to a feature or swimlane step description (memory write). Use for implementation evidence (the test/command that passed) and dated decisions (lightweight ADRs: what was decided and why).', inputSchema: { projectId: z.string().optional(), target: z.enum(['feature', 'swimnode']), id: z.string(), text: z.string() } },
    async ({ projectId, target, id, text }) => {
      const p = await requireProj(projectId)
      await applyAndBroadcast({ type: 'appendNote', projectId: p.id, target, id, text })
      return json({ ok: true })
    },
  )

  // ── Prompts (the playbook, for any MCP client) ───────────────────────────────
  // Standalone restatements of docs/AGENT_PLAYBOOK.md so clients without the
  // Claude Code SKILL.md files still get the process. Keep in sync with the doc.
  const promptText = (text: string) => ({ messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] })

  server.registerPrompt(
    'orient',
    { title: 'Orient on the board', description: 'Recall current board state before doing any work — run this first each session.' },
    () =>
      promptText(
        `Orient on the KineTrak board before touching it. The board is your memory and the single source of truth.\n\n` +
          `1. Pick the project (list_projects if unknown).\n` +
          `2. If you have a stored cursor, call get_changes_since(projectId, since=cursor) for incremental recall; otherwise call get_board(projectId) once and read the "Meta / Project Context" feature for domain/stack/conventions and the last "Cursor:" line.\n` +
          `3. search the area you are about to work on.\n` +
          `4. validate_board(projectId); surface any error-severity issues.\n` +
          `5. log_activity a one-line note that you are starting.\n\n` +
          `Then summarise: where things stand, integrity, and the single best next step. Do not write to the board until oriented. Tip: next_action returns a recommended next step + cursor in one call.`,
      ),
  )

  server.registerPrompt(
    'onboard',
    { title: 'Onboard an existing codebase', description: 'Map an existing codebase onto the board (as-is) before any change — brownfield entry.' },
    () =>
      promptText(
        `Map an EXISTING codebase onto a KineTrak board, as-is, before changing anything. The diagram is the OUTPUT of onboarding, not the tool that performs it. Every board write here is additive.\n\n` +
          `B0 Scan: read the repo with your own file tools (tree, manifests, entry points, conventions) and build a compact as-is summary.\n` +
          `B1 Draft map (additive): find_or_create_module per real area; find_or_create_feature per significant capability (put its repo path in the description); create the "Meta / Project Context" feature from the summary. Mirror the code's real structure — do not idealise it. Status reflects reality (working = done, partial = progress).\n` +
          `B2 Human gate (mandatory): present the map and ask the human to confirm it matches reality; apply corrections; then create_snapshot("v0: as-is").\n` +
          `B3 Hand off: record a resume note on Project Context, then enter the normal lifecycle (specify → … → ship). After B2, restructuring existing modules/features is Tier 4 — ask first.\n\n` +
          `Do NOT use for a brand-new project with no code — that is a discovery interview.`,
      ),
  )

  server.registerPrompt(
    'ship',
    { title: 'Ship a validated feature', description: 'Promote a validated feature to shipped and checkpoint — Tier-4, human-initiated.' },
    () =>
      promptText(
        `Ship a feature that has PASSED validation. This is a Tier-4 action the human owns — only do it on explicit instruction.\n\n` +
          `Preconditions: the feature's swim steps are all done and a passing validation note exists; you have oriented this session.\n` +
          `1. validate_board — do not ship over error-severity issues.\n` +
          `2. update_feature → status: done; move it into the target release column if the project uses releases.\n` +
          `3. create_snapshot with a named, dated label, e.g. "v3: checkout flow shipped" — the immutable reference for what shipped.\n` +
          `4. log_activity the shipment.\n\n` +
          `Then run the session-close routine (note summary + next + cursor on Project Context) or move to the next feature.`,
      ),
  )

  // ── Resources (pull-able context for MCP clients) ────────────────────────────
  // The playbook (static doc) + the live Meta/Project Context node, so a client
  // can fetch the process and the project's durable memory without a tool call.
  server.registerResource(
    'agent-playbook',
    'kinetrak://playbook',
    { title: 'KineTrak Agent Playbook', description: 'The canonical process for operating a KineTrak board over MCP.', mimeType: 'text/markdown' },
    () => {
      let text = SERVER_INSTRUCTIONS
      try {
        text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'AGENT_PLAYBOOK.md'), 'utf8')
      } catch {
        /* fall back to the condensed instructions if the doc isn't bundled */
      }
      return { contents: [{ uri: 'kinetrak://playbook', mimeType: 'text/markdown', text }] }
    },
  )
  server.registerResource(
    'project-context',
    'kinetrak://project-context',
    { title: 'Project Context', description: "The board's durable memory (Meta / Project Context node): domain, stack, conventions, resume cursor.", mimeType: 'text/markdown' },
    async () => {
      const p = await proj()
      const norm = (s: string) => s.trim().toLowerCase()
      const ctx = p?.data.features.find((f) => norm(f.name) === 'project context')
      const text = ctx?.desc ?? 'No "Meta / Project Context" node yet — run the onboard prompt to create one.'
      return { contents: [{ uri: 'kinetrak://project-context', mimeType: 'text/markdown', text }] }
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

/**
 * Mount Streamable-HTTP MCP at /mcp in STATELESS mode: every POST is a fresh,
 * self-contained JSON-RPC exchange — a new server + transport per request, no
 * session id, no in-RAM session map.
 *
 * Why stateless: the tools are pure request/response (no server-initiated
 * notifications), and the deployment sits behind Cloudflare on a single process
 * that restarts on every deploy. A stateful session lives only in that process's
 * RAM, so a container restart (auto-deploy) or a Cloudflare idle-SSE close would
 * strand a client on a session id the server no longer knows — the "session keeps
 * dropping" failure. Stateless removes that entire class of bugs: there is no
 * session to lose, each request re-authorizes by its own key and is independently
 * org-scoped (so the old cross-workspace session guard is unnecessary too).
 *
 * GET/DELETE (which only exist to drive/close a persistent session's SSE stream)
 * have no meaning here, so they 405.
 */
export function registerMcp(app: Express) {
  app.post('/mcp', async (req: Request, res: Response) => {
    const key = authorize(req, res)
    if (!key) return
    try {
      // Fresh, key-scoped instances per request (org scope + activity attribution).
      const server = buildMcpServer(key)
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      res.on('close', () => {
        void transport.close()
        void server.close()
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (e) {
      console.error('MCP request failed:', e)
      if (!res.headersSent)
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null })
    }
  })

  const notAllowed = (_req: Request, res: Response) =>
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed — KineTrak MCP is stateless; use POST /mcp.' }, id: null })
  app.get('/mcp', notAllowed) // no persistent SSE stream in stateless mode
  app.delete('/mcp', notAllowed) // no session to end
}
