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

## Accounts, scoping & API keys

When a server is running, KineTrak requires a **user account**. Each user signs in with
email + password and sees only **their own** workspaces (orgs) and projects. Everything is scoped
per-account, end to end:

- **Web app** — `GET /api/state`, `POST /api/command`, and the `/ws` stream all require a session
  token (`Authorization: Bearer <session>`); each one is filtered/validated against the signed-in
  user. A user can't read or mutate another account's data (`403`).
- **MCP** — every `/mcp` request must carry a valid **API key**. A key belongs to a user and is
  **scoped to one workspace (org)**; the agent only ever sees that workspace's projects. No key →
  `401`.

Auth model:

- **Accounts**: `POST /api/auth/register {email,name,password}` (first account becomes `admin`),
  `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Sessions are opaque bearer
  tokens; the web client stores its token in `localStorage` (no cookies → no cross-origin pain).
  Passwords are scrypt-hashed (`node:crypto`, no extra deps).
- **API keys**: managed on the Connect page or via REST (session required): `GET /api/keys?orgId=`,
  `POST /api/keys {orgId,name}`, `DELETE /api/keys/:id`. Each key carries `userId` + `orgId`; the
  raw secret is `kt_live_…`. Keys also accept the `X-API-Key` header.
- **Storage**: `users.json`, `sessions.json`, `keys.json` live under `server/data/` (git-ignored)
  and are **never** part of the synced board state broadcast to browsers. Treat keys/passwords
  accordingly.

> Local-only mode (no server reachable) keeps the original offline, account-less browser experience.

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

Layout — the agent decides how the board displays, not just its contents:
- `move_swim_node({id,x,y})` — place a swimlane step anywhere on the canvas.
- `arrange_swimlane()` — auto-tidy the whole flow: x by flow depth (longest path along
  arrows), y centered in each lane. One call cleans up the diagram.
- `reorder_modules({orderedIds})` / `reorder_features({orderedIds})` — set display order on the
  Mindmap (branches / rows) and Story Map (columns / rows). Omitted ids keep their order at the end.
- `update_module({id, side})` — pin a module's Mindmap branch to `"left"`/`"right"` of the root
  (`"auto"` to release it back to the auto-balanced split). Also sets `backboneName`/`backboneSub`
  for Story Map column headers.

All write tools take an optional `projectId` (defaults to the first project). Ids are returned so
the agent can chain calls (e.g. `add_module` → `add_feature({moduleId})`).

## Board as memory / context storage

- **Recall**: `get_board` for full context, or `search` for targeted lookup.
- **Persist**: create modules/features/steps, or `append_note` to attach notes onto an existing
  node. Everything is durable (board.json) and instantly visible to the human — so the board is a
  shared, inspectable memory the agent and the person edit together.
