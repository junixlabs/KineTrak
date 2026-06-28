import { createServer } from 'node:http'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { applyAndBroadcast, getRoot, onChange } from './state'
import { registerMcp } from './mcp'

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

// MCP (Streamable HTTP) at /mcp.
registerMcp(app)

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
  console.log(`  • web sync : GET /api/state · POST /api/command · WS /ws`)
  console.log(`  • MCP (HTTP): POST /mcp`)
})
