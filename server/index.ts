import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Request, type Response, type NextFunction } from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import {
  applyAndBroadcast,
  backfillSearchIfEmpty,
  getProject,
  hydrateState,
  onChange,
  projectHeader,
  projectRoot,
  scopedRootForUser,
} from './state'
import { registerMcp } from './mcp'
import { registerWebhooks } from './webhook'
import { createKey, hydrateKeys, listKeys, revokeKey } from './keys'
import {
  AuthError,
  bearerFrom,
  deleteAccount,
  hydrateAuth,
  login,
  logout,
  register,
  toPublic,
  userByToken,
  userCount,
  type User,
} from './auth'
import { authorizeCommand, userOwnsOrg } from './scope'
import { createShare, hydrateShares, projectIdForToken, revokeShare, shareForProject } from './shares'
import { hydrateActivity, listActivity, onActivity } from './activity'
import { assertDatabaseConfigured } from './infra/db'
import { runMigrations } from './infra/migrate'
import type { Project } from '../src/store/types'
import { sampleTemplate } from '../src/store/seed'
import { makeId } from '../src/store/ids'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = join(HERE, '..', 'dist')

const app = express()
// Stash the raw body so VCS webhook adaptors can verify HMAC signatures over the
// exact bytes the provider signed (JSON.stringify would not round-trip identically).
app.use(express.json({ limit: '8mb', verify: (req, _res, buf) => { (req as unknown as { rawBody?: Buffer }).rawBody = buf } }))

// CORS for the Vite dev origin and MCP clients.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id, mcp-protocol-version')
  res.header('Access-Control-Expose-Headers', 'mcp-session-id')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── Auth ─────────────────────────────────────────────────────────────────────
interface AuthedRequest extends Request {
  user?: User
}
const requireUser = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const user = userByToken(bearerFrom(req.headers as Record<string, unknown>))
  if (!user) return res.status(401).json({ ok: false, error: 'Not signed in' })
  req.user = user
  next()
}

/** Give a brand-new account a starter workspace + sample project. */
async function seedWorkspace(user: User) {
  const orgId = makeId('org')
  await applyAndBroadcast({ type: 'createOrg', id: orgId, name: `${user.name}'s workspace`, ownerId: user.id })
  await applyAndBroadcast({
    type: 'importProject',
    id: makeId('p'),
    orgId,
    name: 'KineTrak Platform',
    createdAt: new Date().toISOString(),
    data: sampleTemplate,
    snapshots: [],
  })
}

app.get('/api/health', (_req, res) => res.json({ ok: true, accounts: userCount() }))

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body ?? {}
    const out = await register(email, name, password)
    try {
      await seedWorkspace(userByToken(out.token)!)
    } catch (seedErr) {
      // Roll the account back so the email stays re-usable and no half-seeded
      // workspace lingers (cascade clears the org/project if createOrg landed).
      await deleteAccount(out.user.id).catch(() => {})
      throw seedErr
    }
    res.json({ ok: true, ...out })
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 400
    res.status(status).json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {}
    res.json({ ok: true, ...(await login(email, password)) })
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 400
    res.status(status).json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  await logout(bearerFrom(req.headers as Record<string, unknown>))
  res.json({ ok: true })
})

app.get('/api/auth/me', requireUser, (req: AuthedRequest, res) => res.json({ ok: true, user: toPublic(req.user!) }))

// ── Scoped board sync ──────────────────────────────────────────────────────
app.get('/api/state', requireUser, async (req: AuthedRequest, res) => res.json(await scopedRootForUser(req.user!.id)))

app.post('/api/command', requireUser, async (req: AuthedRequest, res) => {
  try {
    const cmd = authorizeCommand(req.user!, req.body)
    await applyAndBroadcast(cmd, { kind: 'human', name: req.user!.name })
    res.json({ ok: true, root: await scopedRootForUser(req.user!.id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    res.status(msg.startsWith('forbidden') ? 403 : 400).json({ ok: false, error: msg })
  }
})

// ── API keys (scoped to the user + a chosen org) ────────────────────────────
app.get('/api/keys', requireUser, (req: AuthedRequest, res) => {
  const orgId = typeof req.query.orgId === 'string' ? req.query.orgId : undefined
  res.json({ keys: listKeys(req.user!.id, orgId) })
})
app.post('/api/keys', requireUser, async (req: AuthedRequest, res) => {
  const { orgId, name } = req.body ?? {}
  if (typeof orgId !== 'string' || !userOwnsOrg(req.user!.id, orgId))
    return res.status(403).json({ ok: false, error: 'Choose one of your own workspaces' })
  res.json({ ok: true, key: await createKey(req.user!.id, orgId, typeof name === 'string' ? name : undefined) })
})
app.delete('/api/keys/:id', requireUser, async (req: AuthedRequest, res) => {
  const ok = await revokeKey(req.user!.id, req.params.id as string)
  res.status(ok ? 200 : 404).json({ ok })
})

// ── Public read-only share links (present-style) ────────────────────────────
// Ownership check over the resident catalog (no board payload needed).
const ownsProject = (userId: string, projectId: string): boolean => {
  const h = projectHeader(projectId)
  return !!h && userOwnsOrg(userId, h.orgId)
}

app.get('/api/projects/:id/share', requireUser, (req: AuthedRequest, res) => {
  const id = req.params.id as string
  if (!ownsProject(req.user!.id, id)) return res.status(404).json({ ok: false })
  res.json({ ok: true, token: shareForProject(id)?.token ?? null })
})
app.post('/api/projects/:id/share', requireUser, async (req: AuthedRequest, res) => {
  const id = req.params.id as string
  if (!ownsProject(req.user!.id, id)) return res.status(403).json({ ok: false, error: 'Not your project' })
  res.json({ ok: true, token: (await createShare(id)).token })
})
app.delete('/api/projects/:id/share', requireUser, async (req: AuthedRequest, res) => {
  const id = req.params.id as string
  if (!ownsProject(req.user!.id, id)) return res.status(403).json({ ok: false })
  res.json({ ok: await revokeShare(id) })
})

// Anonymous, read-only board for a share token.
app.get('/api/shared/:token', async (req, res) => {
  const pid = projectIdForToken(req.params.token as string)
  const p = pid ? await getProject(pid) : null
  if (!p) return res.status(404).json({ ok: false, error: 'Link not found or revoked' })
  res.json({ id: p.id, name: p.name, data: p.data })
})

// Activity feed for a project (the human watches what the agent does).
app.get('/api/projects/:id/activity', requireUser, (req: AuthedRequest, res) => {
  const id = req.params.id as string
  if (!ownsProject(req.user!.id, id)) return res.status(404).json({ ok: false })
  const since = Number(req.query.since) || 0
  res.json({ ok: true, items: listActivity(id, since) })
})

// VCS webhooks (GitHub/GitLab) → flag outdated board nodes.
registerWebhooks(app)

// MCP (Streamable HTTP) at /mcp.
registerMcp(app)

// Serve the built web client (production: web + API + MCP on one port).
const hasDist = existsSync(join(DIST, 'index.html'))
if (hasDist) {
  app.use(express.static(DIST))
  // SPA fallback — serve index.html for app routes (not API/MCP/WS).
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    if (req.path.startsWith('/api') || req.path.startsWith('/mcp') || req.path.startsWith('/ws')) return next()
    res.sendFile(join(DIST, 'index.html'))
  })
}

const server = createServer(app)

// ── Realtime, per-user scoped broadcast ──────────────────────────────────────
interface AuthedSocket extends WebSocket {
  userId?: string
  /** Read-only share viewer bound to one project. */
  shareProjectId?: string
}
const wss = new WebSocketServer({ server, path: '/ws' })
const sendScoped = async (ws: AuthedSocket) => {
  if (ws.readyState !== WebSocket.OPEN) return
  // Bridge: still ships the whole scoped root (assembled on demand). Phase 3
  // replaces this with per-project room subscriptions.
  const root = ws.userId
    ? await scopedRootForUser(ws.userId)
    : ws.shareProjectId
      ? await projectRoot(ws.shareProjectId)
      : null
  if (root && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'state', root }))
}
wss.on('connection', (ws: AuthedSocket, req) => {
  const params = new URL(req.url ?? '', 'http://x').searchParams
  const share = projectIdForToken(params.get('share') ?? undefined)
  if (share) {
    ws.shareProjectId = share // anonymous read-only viewer
  } else {
    const user = userByToken(params.get('token') ?? undefined)
    if (!user) {
      ws.close(4001, 'unauthorized')
      return
    }
    ws.userId = user.id
  }
  void sendScoped(ws)
})
// A single project changed → push just that project to clients who can see it
// (the main per-project "room" delta). Share viewers keep the {type:'state'} shape.
function sendProjectFrame(project: Project) {
  const delta = JSON.stringify({ type: 'project', project })
  const shareFrame = JSON.stringify({ type: 'state', root: { orgs: [], projects: [project] } })
  wss.clients.forEach((c) => {
    const ws = c as AuthedSocket
    if (ws.readyState !== WebSocket.OPEN) return
    if (ws.shareProjectId === project.id) ws.send(shareFrame)
    else if (ws.userId && ownsProject(ws.userId, project.id)) ws.send(delta)
  })
}

onChange((e) => {
  // Catalog lifecycle (rare) → resync the whole scoped root; a board mutation
  // (frequent) → ship only the changed project. No more whole-root re-broadcast
  // on every edit.
  if (e.kind === 'catalog') wss.clients.forEach((c) => void sendScoped(c as AuthedSocket))
  else sendProjectFrame(e.project)
})

// Push each activity entry to clients who can see that project (owner or share viewer).
onActivity((entry) => {
  const msg = JSON.stringify({ type: 'activity', item: entry })
  wss.clients.forEach((c) => {
    const ws = c as AuthedSocket
    if (ws.readyState !== WebSocket.OPEN) return
    const canSee = ws.shareProjectId === entry.projectId || (ws.userId && ownsProject(ws.userId, entry.projectId))
    if (canSee) ws.send(msg)
  })
})

const PORT = Number(process.env.PORT) || 8787

/** Require Postgres, run migrations, hydrate the in-RAM caches, then listen. */
async function bootstrap() {
  assertDatabaseConfigured()
  await runMigrations()
  await Promise.all([hydrateAuth(), hydrateKeys(), hydrateShares(), hydrateState(), hydrateActivity()])
  await backfillSearchIfEmpty()
  server.listen(PORT, () => {
    console.log(`KineTrak server → http://localhost:${PORT}`)
    console.log(`  • storage  : Postgres`)
    if (hasDist) console.log(`  • web app  : http://localhost:${PORT}  (serving dist/)`)
    else console.log(`  • web app  : run "npm run dev" (Vite on 5173) or "npm run build" first`)
    console.log(`  • accounts : ${userCount()} registered · POST /api/auth/{register,login,logout} · GET /api/auth/me`)
    console.log(`  • web sync : GET /api/state · POST /api/command · WS /ws  (session token required)`)
    console.log(`  • MCP (HTTP): POST /mcp  (per-key user+org scope)`)
  })
}

bootstrap().catch((e) => {
  console.error('KineTrak failed to start:', e)
  process.exit(1)
})
