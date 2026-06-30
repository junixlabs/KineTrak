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

## Storage: Postgres (required)

The server persists to **Postgres** — set `DATABASE_URL` or it refuses to start. (The *browser*
still has its own local-only mode over `localStorage` when no server is reachable; that is separate
from server storage.)

```bash
export DATABASE_URL=postgres://kinetrak:kinetrak@localhost:5432/kinetrak
npm run db:migrate     # apply schema migrations (also run automatically on server boot)
npm run db:import      # one-time: import a legacy server/data/*.json store into Postgres
npm start
```

`docker compose up` brings up Postgres + the app together (the compose files set `DATABASE_URL`).
Schema lives in `server/infra/schema.ts`; migrations in `server/infra/migrations`
(`npm run db:generate` after a schema change). On-demand per-project loading + a CQRS search
projection + per-project live deltas — see [`docs/DB_MIGRATION_PLAN.md`](docs/DB_MIGRATION_PLAN.md).

> **API keys** are hashed at rest — the secret is shown **once** on creation and cannot be
> recovered (only the prefix is stored). Re-mint a key if you lose it.

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

### Auto-deploy (CI/CD → VPS)

On every push to `main`, the `docker` job builds & pushes `:latest`, then the `deploy` job SSHes into
the server and rolls it out: `cd /opt/kinetrak && docker compose pull && docker compose up -d`, prune,
then an `/api/health` check. It uses the compose file **already on the server** (which binds
`127.0.0.1:54440` behind a Cloudflare Tunnel + a named data volume) and never overwrites it.

Repo **secrets** (Settings → Secrets and variables → Actions):

| Secret | Required | Notes |
|---|---|---|
| `DEPLOY_HOST` | ✓ | server IP / hostname |
| `DEPLOY_USER` | ✓ | SSH user |
| `DEPLOY_SSH_KEY` | ✓ | private key of a dedicated deploy key in the server's `authorized_keys` |

Optional repo **variables**: `DEPLOY_PATH` (default `/opt/kinetrak`), `DEPLOY_HEALTH_PORT`
(default `54440`, the host port the container is published on).

## Accounts

When a server is running, KineTrak requires a **user account** (email + password). Each user sees
only their own workspaces and projects; the first account to register becomes `admin`. Sessions are
bearer tokens kept in `localStorage`. With no server reachable, the app falls back to the original
local-only, account-less browser mode.

## Connect an AI agent (MCP)

Streamable-HTTP endpoint: **`http://<host>:8787/mcp`**

```bash
claude mcp add --transport http kinetrak http://localhost:8787/mcp \
  --header "Authorization: Bearer <YOUR_API_KEY>"
```

Open the **Connect** page in the app (Home → *Connect agent*, or the *Connect* button in the
workspace) to mint/copy/revoke API keys and grab ready-made config snippets. Each key belongs to your
account and is **scoped to one workspace** — the agent only sees that workspace's projects. Every
`/mcp` request requires a valid key.

Tools: `get_board` / `list_projects` / `search` (read + memory recall) and full CRUD on
modules, features, swimlane nodes & edges, plus `create_snapshot` and `append_note`.

## Stack

React + Vite + TypeScript · React Flow · Zustand · Tailwind · Node (express + ws) · MCP SDK ·
Postgres + Drizzle (required).
More: [`docs/PRODUCT.md`](docs/PRODUCT.md) (full spec), [`docs/MCP.md`](docs/MCP.md) (agent / MCP).
