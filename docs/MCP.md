# KineTrak MCP — agent-operable board

KineTrak runs a small server that owns the board and exposes it two ways:

- **Web sync** for the browser (humans watch changes live).
- **MCP over Streamable HTTP** for an AI agent (read + full edit + memory recall).

Both the agent and the human mutate through the **same command reducer**
(`src/shared/board.ts`), so agent edits and human edits behave identically and every change is
broadcast to all browsers instantly.

```
        ┌──────────── Node server (port 8787) ────────────┐
 Agent  │  POST /mcp  ──► MCP tools ─┐                     │
 (MCP)  │                            ├─► applyCommand ─► board.json
 Human  │  POST /api/command ────────┘        │            │
 (web)  │  GET  /api/state (hydrate)          ▼            │
        │  WS   /ws  ◄──── broadcast new state to browsers │
        └──────────────────────────────────────────────────┘
```

## Run

```bash
npm install
npm run server     # http://localhost:8787  (MCP + sync)
npm run dev        # http://localhost:5173  (web UI; auto-connects to the server)
```

The web app auto-detects the server; the header shows **Live · synced** when connected, **Local**
when running standalone (localStorage only). Override the server URL with `VITE_SYNC_URL`.
Board state persists to `server/data/board.json` (git-ignored; delete it to reseed the sample).

## Connect an agent (Claude Code / Desktop)

Streamable HTTP endpoint: **`http://localhost:8787/mcp`**

Claude Code:
```bash
claude mcp add --transport http kinetrak http://localhost:8787/mcp
```
or in `.mcp.json` / client config:
```json
{ "mcpServers": { "kinetrak": { "type": "http", "url": "http://localhost:8787/mcp" } } }
```

## Tools

Read / memory:
- `list_projects` — projects with ids + counts.
- `get_board({projectId?})` — full board as structured context (modules, features, lanes,
  swimlane graph, releases). Use this as the agent's working context.
- `search({query, projectId?})` — recall across names, descriptions, constraints.

Write (each broadcasts live to the browser):
- modules: `add_module`, `update_module`, `delete_module`
- features: `add_feature`, `update_feature`, `delete_feature`
- swimlane: `add_swim_node`, `update_swim_node`, `delete_swim_node`, `add_swim_edge`, `delete_swim_edge`
- versioning / memory: `create_snapshot`, `append_note` (append a line to a feature/step description)

All write tools take an optional `projectId` (defaults to the first project). Ids are returned so
the agent can chain calls (e.g. `add_module` → `add_feature({moduleId})`).

## Board as memory / context storage

- **Recall**: `get_board` for full context, or `search` for targeted lookup.
- **Persist**: create modules/features/steps, or `append_note` to attach notes onto an existing
  node. Everything is durable (board.json) and instantly visible to the human — so the board is a
  shared, inspectable memory the agent and the person edit together.
