import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { applyAndBroadcast, getRoot, onChange } from './state'
import { registerMcp } from './mcp'
import { authEnabled, createKey, listKeys, revokeKey } from './keys'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = join(HERE, '..', 'dist')

const app = express()
app.use(express.json({ limit: '8mb' }))

// CORS for the Vite dev origin and MCP clients.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version')
  res.header('Access-Control-Expose-Headers', 'mcp-session-id')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Web client sync API.
app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.get('/api/state', (_req, res) => res.json(getRoot()))
app.post('/api/command', (req, res) => {
  try {
    const root = applyAndBroadcast(req.body)
    res.json({ ok: true, root })
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e) })
  }
})

// API key management for MCP access (used by the Connect page).
app.get('/api/keys', (_req, res) => res.json({ authEnabled: authEnabled(), keys: listKeys() }))
app.post('/api/keys', (req, res) => {
  const key = createKey(typeof req.body?.name === 'string' ? req.body.name : undefined)
  res.json({ ok: true, key })
})
app.delete('/api/keys/:id', (req, res) => {
  const ok = revokeKey(req.params.id)
  res.status(ok ? 200 : 404).json({ ok })
})

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

// Realtime broadcast to browsers.
const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', root: getRoot() }))
})
onChange((root) => {
  const msg = JSON.stringify({ type: 'state', root })
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg)
  })
})

const PORT = Number(process.env.PORT) || 8787
server.listen(PORT, () => {
  console.log(`KineTrak server → http://localhost:${PORT}`)
  if (hasDist) console.log(`  • web app  : http://localhost:${PORT}  (serving dist/)`)
  else console.log(`  • web app  : run "npm run dev" (Vite on 5173) or "npm run build" first`)
  console.log(`  • web sync : GET /api/state · POST /api/command · WS /ws`)
  console.log(`  • MCP (HTTP): POST /mcp  ${authEnabled() ? '(API key required)' : '(open — create a key on the Connect page to lock down)'}`)
})
