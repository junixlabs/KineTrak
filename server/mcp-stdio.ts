import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { buildMcpServer } from './mcp'
import { verifyKey, hydrateKeys } from './keys'
import { hydrateAuth } from './auth'
import { hydrateShares } from './shares'
import { hydrateState, backfillSearchIfEmpty } from './state'
import { hydrateActivity } from './activity'
import { assertDatabaseConfigured } from './infra/db'
import { runMigrations } from './infra/migrate'

// ── MCP over stdio (local / CLI agents) ──────────────────────────────────────
// The same MCP server as /mcp, but spoken over stdin/stdout for a locally-spawned
// agent (no HTTP, no session routing). Auth is a single API key from the
// KINETRAK_MCP_KEY env var — it resolves to the same user+org scope as the HTTP
// transport, so a stdio agent sees exactly one workspace.
//
//   KINETRAK_MCP_KEY=kt_live_… DATABASE_URL=… npm run mcp:stdio

async function main() {
  const secret = process.env.KINETRAK_MCP_KEY
  if (!secret) {
    console.error('MCP stdio: set KINETRAK_MCP_KEY to a KineTrak API key (kt_live_…).')
    process.exit(1)
  }

  assertDatabaseConfigured()
  await runMigrations()
  await Promise.all([hydrateAuth(), hydrateKeys(), hydrateShares(), hydrateState(), hydrateActivity()])
  await backfillSearchIfEmpty()

  const key = verifyKey(secret)
  if (!key) {
    console.error('MCP stdio: KINETRAK_MCP_KEY is not a valid/known API key.')
    process.exit(1)
  }

  const server = buildMcpServer(key)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Server now serves over stdio until the client disconnects.
}

main().catch((e) => {
  console.error('MCP stdio failed to start:', e)
  process.exit(1)
})
