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

**One command — everything on one port (recommended):**
```bash
npm install
npm start          # builds the web, then serves web + API + WS + MCP on http://localhost:8787
```
Open `http://localhost:8787` — the web app, sync API/WS, and the MCP endpoint all share that origin.

**Dev (hot reload, one command):**
```bash
npm run dev:all    # Vite (http://localhost:5173) + server (http://localhost:8787) together
```
In dev the web runs on 5173 and auto-connects to the server on 8787.

**Docker (one command):**
```bash
docker compose up --build          # → http://localhost:8787
# or: docker build -t kinetrak . && docker run -p 8787:8787 -v kinetrak-data:/app/server/data kinetrak
```
Board state persists in the `kinetrak-data` volume (`/app/server/data`).

The header shows **Live · synced** when connected to the server, **Local** when standalone
(localStorage only — the app still works with no server). Override the server URL with
`VITE_SYNC_URL`. Board state persists to `server/data/board.json` (git-ignored; delete it to reseed).

## Connect an agent (Claude Code / Desktop)

Streamable HTTP endpoint: **`http://localhost:8787/mcp`**

The fastest path is the in-app **Connect page** — open the app, then *Home → Connect agent* (or the
*Connect* button in the workspace header). It lets you create/copy/revoke API keys, shows the live
endpoint, and gives copy-paste config snippets with the key already embedded.

Claude Code:
```bash
claude mcp add --transport http kinetrak http://localhost:8787/mcp \
  --header "Authorization: Bearer <YOUR_API_KEY>"
```
or in `.mcp.json` / client config:
```json
{
  "mcpServers": {
    "kinetrak": {
      "type": "http",
      "url": "http://localhost:8787/mcp",
      "headers": { "Authorization": "Bearer <YOUR_API_KEY>" }
    }
  }
}
```

## Authentication — accounts & API keys

The board is gated by **Bearer API keys** so only authorized agents can read/edit it.

- **Backward-compatible by default**: while no keys exist, `/mcp` is open (zero-config dev). The
  moment you create the first key, a valid `Authorization: Bearer <key>` is required — requests
  without one get `401`.
- **Manage keys** on the Connect page, or via REST: `GET /api/keys`, `POST /api/keys {name}`,
  `DELETE /api/keys/:id`. Keys also accept the `X-API-Key: <key>` header.
- **Headless / Docker**: seed a fixed key with the `KINETRAK_API_KEY` env var. It's shown on the
  Connect page as an `ENV` key and can't be deleted via the API (manage it through the environment).
- **Storage**: keys live in `server/data/keys.json` (git-ignored) — never in synced board state, so
  they're never broadcast to browsers. Treat them like passwords.

> Scope: keys gate the agent-facing `/mcp` endpoint. The human web-sync API (`/api/state`,
> `/api/command`, `/ws`) stays open for the local-first browser experience.

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
