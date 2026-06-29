# KineTrak

A **visual operating interface** for product teams: run the whole project lifecycle through
**three synchronized living diagrams** — Mindmap, Story Map, Swimlane — over a **single source of
truth**. KineTrak is built to be **operated by an AI agent over MCP** while humans watch every
change live; the board doubles as the agent's **memory / context store**.

## Business logic (in short)

- **Kill long text docs** — 80% of the information lives in the diagram, 20% hidden inside card
  detail (description, constraints, validation, cross-links).
- **One data model, three views, instant cross-view sync (SSOT)** — change a status in one view and
  every other view updates immediately.
- **Structure**: Orgs → Projects; each project has Modules → Features, a Story Map (journey ×
  release), and a Swimlane workflow. Per-project **snapshots** (version history), **role filter**,
  **semantic zoom**.
- **Agent + human, same board** — both edit through one command reducer; the server is authoritative
  and broadcasts every change over WebSocket, so humans see agent actions in real time.
- **Local-first fallback** — runs standalone (localStorage) when no server is present.

## Quick setup

```bash
npm install
npm start            # build + serve web + API + WS + MCP on http://localhost:8787
# dev (hot reload):  npm run dev:all       (web :5173 + server :8787)
# Docker (1 command): docker compose up --build
```

## Deploy (pull the prebuilt image — no source needed)

CI (GitHub Actions) builds and pushes the image to **GHCR** on every push to `main`.
On the server, just pull and run:

```bash
docker login ghcr.io                                  # PAT with read:packages
docker run -d -p 8787:8787 \
  -v kinetrak-data:/app/server/data \
  ghcr.io/junixlabs/kinetrak:latest
```

Or copy `docker-compose.deploy.yml` to the server and run `docker compose -f docker-compose.deploy.yml up -d`.
Board state persists in the `kinetrak-data` volume.

## Connect an AI agent (MCP)

Streamable-HTTP endpoint: **`http://<host>:8787/mcp`**

```bash
claude mcp add --transport http kinetrak http://localhost:8787/mcp \
  --header "Authorization: Bearer <YOUR_API_KEY>"
```

Open the **Connect** page in the app (Home → *Connect agent*, or the *Connect* button in the
workspace) to create/copy an API key and grab ready-made config snippets. The `/mcp` endpoint is
open until you create the first key, then a valid Bearer key is required. For headless deploys, seed
a fixed key with the `KINETRAK_API_KEY` env var.

Tools: `get_board` / `list_projects` / `search` (read + memory recall) and full CRUD on
modules, features, swimlane nodes & edges, plus `create_snapshot` and `append_note`.

## Stack

React + Vite + TypeScript · React Flow · Zustand · Tailwind · Node (express + ws) · MCP SDK.
More: [`docs/PRODUCT.md`](docs/PRODUCT.md) (full spec), [`docs/MCP.md`](docs/MCP.md) (agent / MCP).
