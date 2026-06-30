# KineTrak — DB Migration Plan (Postgres, load-per-project on-demand)

> Direction **(B)**: PostgreSQL as the durable store + **on-demand per-project loading**
> (no longer hold the whole `Root` in RAM). Designed with proper layering / DDD patterns.
> Status: **Phases 0–5 COMPLETE and deployed to prod (2026-06-30).** Postgres is now the only
> server store — the file-JSON path was removed and the server fails fast without `DATABASE_URL`.
> (The browser's own no-server localStorage mode is unaffected.)
>
> Earlier phases, for reference:
> - **0–1**: Postgres store behind `DATABASE_URL` + file-JSON fallback; prod cut over to Postgres.
> - **2**: on-demand per-project loading — Store port + `LoadedProject` aggregate + `ProjectRegistry`
>   (identity map + TTL eviction). Resident catalog (orgs + headers) only; boards load on demand.
> - **3**: per-project live delta — board mutations push only the changed project (`{type:'project'}`)
>   to clients that can see it; catalog lifecycle resyncs the scoped root. No whole-root re-broadcast.
>   Verified live in a browser. Explicit subscribe/unsubscribe rooms deferred (YAGNI at current scale).
> - **4**: `search_items` CQRS read projection — `search` runs SQL over it (no board loaded); backfilled
>   at boot. Optimistic `version` column bumps on each write (enforcement deferred to multi-process).
>
> Phase 5 (remove the file-JSON path) is optional — the fallback is intentionally kept.
> Verified throughout: 11 unit/repo tests, PG + file e2e, durability across restart, live browser
> delta + search, prod e2e after each deploy.

## 0. Core trade-off (read first)

(B) is **not a backend-only change**. Today the server keeps the whole `Root` in RAM and
broadcasts `scopeRootForUser` to every socket on each change. Once we stop holding every project
in RAM, **realtime must move from "push the whole root" to "pub/sub per-project rooms"** — which
forces **frontend changes** too (Zustand store + `subscribe`/`unsubscribe` on project open/close).

The plan is phased so the **Tier 0/1 wins (ACID, FK cascade, hashed keys, durable activity) land
early in Phase 1**, while the invasive realtime change is pushed to the end and can be deferred.

## 1. Design patterns applied

| Pattern | Where | Why |
|---|---|---|
| **Hexagonal / Ports & Adapters** | `domain` ↔ `infra` | Reducer + aggregate know nothing about Postgres; repos are *ports*, Drizzle is the *adapter* → fakeable in tests, swappable DB |
| **Repository (per aggregate)** | User/Org/Project/Key/Session/Activity/Share | SQL out of logic; FK cascade replaces manual cleanup (`revokeOrgKeys`) |
| **Aggregate Root (DDD)** | `LoadedProject` | A project owns its `data` + snapshots, applies board commands, persists, holds its room listeners |
| **Identity Map + LRU/TTL cache** | `ProjectRegistry` | One instance per `projectId` in a process → serialized writes, no intra-process clobber; evict when idle |
| **Unit of Work / transaction** | mutation + activity insert | `data` write and activity write in **one transaction** → feed never diverges from state |
| **CQRS-lite (read projections)** | `activity`, `search_items` | Reads (list/search/feed) don't load the aggregate; projections updated on the write path |
| **Pub/Sub rooms (scoped Observer)** | `Hub` (WS) | Board change → only that project's room; catalog change → owner's catalog channel |
| **Command pattern** | existing `Command` + `applyCommand` | Keep as-is — never touch the reducer shared with the client |
| **Dependency Injection (composition root)** | `index.ts` | Wire repos/services in one place; services take ports via constructor |

## 2. Two aggregates

```
Catalog aggregate            Project aggregate (load-on-demand)
─────────────────            ──────────────────────────────────
orgs                         project.data (WorkspaceData)
project headers              project.snapshots
(id, orgId, name, createdAt) version (optimistic lock)
```

- **Catalog**: small, relational → handled by SQL in `CatalogService` (7 commands, 1:1, FK cascade).
  `createProject` calls `templateData(template)` directly to build the initial JSONB — no reducer.
- **Project (board)**: document → **reuse `applyCommand` unchanged** via a single-project mini-root:

```ts
function applyBoardCommand(p: Project, cmd: Command): Project {
  const next = applyCommand({ orgs: [], projects: [p] }, cmd)
  return next.projects[0]
}
```

## 3. Postgres schema (Drizzle)

```
users(id pk, email unique, name, salt, hash, role, created_at)
sessions(token pk, user_id → users on delete cascade, expires_at)
orgs(id pk, name, owner_id → users on delete cascade)
projects(id pk, org_id → orgs on delete cascade, name, created_at,
         data jsonb not null, snapshots jsonb not null default '[]',
         schema_version int not null default 1,
         version int not null default 0)           -- optimistic lock
api_keys(id pk, user_id → users, org_id → orgs on delete cascade,
         name, key_hash, key_prefix, created_at, last_used_at)   -- hashed (Tier 1)
shares(token pk, project_id → projects on delete cascade, created_at, expires_at null)
activity(id bigserial pk, project_id → projects on delete cascade,
         ts timestamptz, actor_kind, actor_name, summary, target_id, kind)  -- append-only; cursor = id
search_items(project_id, kind, item_id, label, text, tsv tsvector,          -- read projection
             primary key(project_id, kind, item_id))                        -- GIN index on tsv
```

- `version`: write via `UPDATE … WHERE id=$ AND version=$old`; 0 rows → conflict → reload + replay
  (commands are deterministic and carry their own ids). Single process is safe by the registry's
  per-project serialization; the column is insurance for multi-process later.
- `activity.id` (bigserial) is the `get_changes_since` cursor (avoids ts collisions).
- `search_items` projection updated on each project write → `search` runs as `to_tsquery` over the
  org's rows, no doc load.

## 4. On-demand loading

```ts
class LoadedProject {            // Aggregate Root
  private room = new Set<WS>()
  private queue = Promise.resolve()              // serialize writes within the process
  apply(cmd, actor) {                            // one command = one transaction
    return this.queue = this.queue.then(() => this.repo.uow(async (tx) => {
      this.project = applyBoardCommand(this.project, cmd)
      await tx.projects.save(this.project)       // UPDATE … WHERE version
      const entry = await tx.activity.record(actor, cmd, this.project)
      await tx.search.reindex(this.project)
      this.broadcast(cmd, entry)
    }))
  }
}

class ProjectRegistry {          // Identity Map + TTL eviction
  acquire(projectId): Promise<LoadedProject>     // load if absent
  release(projectId)                             // evict when room empty + idle
}
```

## 5. Realtime: pub/sub rooms (`Hub`) — touches frontend

- Connect → auth (token/share).
- Server pushes a **catalog channel** (orgs + project headers — small, cheap) to the user; catalog
  changes re-push to the owner.
- Client opens project → `{type:'subscribe', projectId}` → `registry.acquire`, join room, send
  current `data`. Board change → push to that room only.
- `{type:'unsubscribe'}` / close → leave room → registry may evict.

**Frontend changes (the real cost of B):** split store into `catalog` + `activeProject.data`;
send subscribe/unsubscribe on navigation; handle two WS message types.

## 6. Read paths

| Tool/endpoint | Now | After (B) |
|---|---|---|
| `list_projects` / sidebar | filter root in RAM | repository query by owner/org |
| `get_board` | find in root | `registry.acquire(projectId)` → `data` |
| `search` | scan all projects in RAM | SQL `to_tsquery` on org's `search_items` (no doc load) |
| activity / `get_changes_since` | ring buffer file | `SELECT … WHERE project_id=$ AND id > $cursor` |

## 7. Write path

**Board command**: auth → `authorizeCommand` → `registry.acquire(projectId)` → `loaded.apply` (tx:
reducer → `UPDATE projects WHERE version` → `INSERT activity` → reindex `search_items` → commit) →
broadcast to room.

**Catalog command**: `CatalogService` opens a tx, direct SQL (insert/rename/delete + cascade),
broadcast catalog to owner.

## 8. Directory layout (as built)

The shipped code uses a flatter layout than the aspirational DDD sketch this plan opened with — the
ports/adapters split survives only where it earns its keep (the `Store` port + `ProjectRegistry`),
not as a full domain/app/http hierarchy. Actual tree:

```
server/
  index.ts             composition root: Express app, REST routes, WS, boot/hydrate (HTTP + ws inline)
  mcp.ts               MCP tools (registerTool) + Streamable-HTTP transport, scoped per API key
  state.ts             orchestrator — the only place mutations happen (catalog cmds + board cmds)
  auth.ts keys.ts shares.ts   user/session, API-key, share-link logic (RAM cache warmed at boot)
  scope.ts             per-user authorization boundary (pure; injectable catalog → unit-tested)
  activity.ts          activity log: bounded RAM ring + write-behind to Postgres
  runtime/             ProjectRegistry.ts (identity map + TTL eviction), LoadedProject.ts (aggregate)
  infra/
    db.ts              lazy pg pool + drizzle client (requireDb)
    schema.ts          Drizzle schema (users/sessions/orgs/projects/api_keys/shares/activity/search_items)
    store.ts           Store port (Ports) + the single Postgres adapter (pgStore)
    repositories.ts    Drizzle repositories (Adapters): user/session/org/project/key/share/activity/search
    migrations/        generated SQL + journal
  migrate-from-json.ts one-time legacy JSON → Postgres importer
```

`Store` (in `infra/store.ts`) is the one real port — the orchestrator talks only to it, and tests
inject an in-memory fake (`runtime/ProjectRegistry.test.ts`). The "Services" / `http/` / `domain/`
folders in the original sketch were never split out; their responsibilities live in the flat modules
above. There is no separate `UnitOfWork`/`Hub` — per-project write serialization lives in
`LoadedProject`, and the WS hub is inline in `index.ts`.

## 9. Migration & cutover

- `migrate-from-json.ts`: read `board.json/users.json/keys.json/...` → insert rows (re-hash keys on
  import; old plaintext keys must be re-minted, or keep a temp column then drop).
- `schema_version` inside `projects.data` for future board-structure migrations.
- Client local-first fallback (no server) stays untouched.

## 10. Phases (each shippable + tested)

| Phase | Work | Value |
|---|---|---|
| **0** | Postgres + Drizzle + schema + migrations; `db` service in docker-compose; importer; repo tests | Infra ready, no behavior change |
| **1** | Move **catalog + auth + keys + sessions + shares + activity** to repositories (board still whole-root RAM) | **ACID, FK cascade, hashed keys, durable activity — most of Tier 0/1**, no realtime change yet |
| **2** | `ProjectRegistry` + `LoadedProject`; board read/write on-demand; drop whole-root RAM for board; WS bridge | Memory no longer holds every project |
| **3** | Realtime rooms + subscribe/unsubscribe protocol + **frontend store changes** | The real (B) realtime |
| **4** | `search_items` projection + SQL search; `version` optimistic lock; eviction tuning | Search & concurrency scale-ready |
| **5** | Cutover: run importer in prod, flip default to Postgres, remove file-JSON paths (or behind a flag) | Done |

**Recommendation:** re-evaluate after **Phase 1** — most durability/security wins are in by then
without paying the realtime cost. At personal + few-project scale, Phases 2–4 can wait until RAM /
concurrency actually bites.

## 11. Risks / open decisions

- **(B) forces frontend changes** (Phase 3). Backend-only = direction (A).
- **Multi-process**: sticky-routing by projectId, or optimistic `version` + replay. Single process
  is enough at current scale; the design does not preclude scaling.
- **Driver**: **Drizzle** (typed + tidy migrations, low-magic). Minimal alternative: raw `pg` + SQL
  migrations folder.
