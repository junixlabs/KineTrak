# KineTrak server conventions

How to extend the server without making it messy. These are **invariants** — CI
(`typecheck:server` + tests + build) and code review enforce them. Read this before
adding a command, a tool, a table, or a persistence path.

> For the invariants that govern **board data** (flow scoping, layout, definition-of-done)
> rather than server code, see `docs/BOARD_QUALITY.md`. They are enforced in
> `src/shared/boardInvariants.ts` via the shared `boardIssues()` detector, and surfaced by
> `validate_board` / `create_snapshot` / `next_action`.

## Layers (dependency points downward)

```
http/         REST + WS + MCP controllers (thin: parse → call → respond)
  index.ts · mcp.ts
state.ts      orchestrator — the only module that mutates board/catalog state
runtime/      LoadedProject (aggregate) · ProjectRegistry (identity map + TTL)
infra/        Store port + Postgres adapter · repositories (drizzle) · db · migrate
src/shared/   board.ts — the pure reducer + search extractor, shared with the client
```

Rules:
- **Only `state.ts` mutates state.** Controllers call `applyAndBroadcast(cmd, actor)`;
  they never touch the registry, catalog, or repositories directly.
- **`infra` is reached only through the `Store` port** (`infra/store.ts`). Domain code
  never imports drizzle. Adding a new persisted operation = add it to `Store` + the
  Postgres adapter, never inline SQL in `state.ts`/`mcp.ts`.
- **The reducer (`src/shared/board.ts`) stays pure** and import-free of server code —
  it runs in the browser too. Mint ids/timestamps in the caller and pass them in the command.

## The three aggregates

- **Catalog** (orgs + project *headers*) is resident in RAM (`state.getCatalog()`), used
  for listing and scoping. Cheap, always loaded.
- **Project board** (the heavy `WorkspaceData` + snapshots) loads on demand through the
  **`ProjectRegistry`** and is evicted when idle. One `LoadedProject` per id at a time.
- **Org boards** (system maps) are small JSONB documents kept resident like the catalog
  (`state.getOrgBoards()`), written through `applyOrgBoard` with the same persist-first
  invariant. Their commands are routed by the `ORG_BOARD_CMDS` set in `state.ts`.

## Write-path invariants (where the bugs were)

1. **Board commands go through the aggregate.** `applyAndBroadcast` routes a board command
   to `registry.acquire(projectId).apply(cmd)`. Never mutate `loaded.project.data` directly.

2. **Aggregate writes are serialized, atomic, and non-poisoning** (`LoadedProject.apply`):
   - one command at a time (promise-chain queue);
   - the in-RAM board advances **only if** `store.saveProject` succeeds; on failure it is
     rolled back to the pre-command state and the error is rethrown;
   - a failed write **must not** reject the shared queue — one transient DB error may never
     brick later commands. (Test: *"apply rolls back … does NOT poison the queue"*.)

3. **Catalog mutations persist before they commit** (`applyCatalog`): `await store.…()`
   first, *then* update the resident catalog/registry. A failed write leaves no orphan
   header or resident project. New catalog commands MUST follow this order.

4. **Multi-write endpoints roll back on partial failure.** e.g. `register` deletes the
   account if `seedWorkspace` throws, so the email stays re-usable (FK cascade cleans up).

5. **Reads are synchronous against RAM caches; writes are async and awaited.** auth/keys/
   shares/activity keep an in-RAM cache warmed at boot (`hydrate*`) for sync lookups, and
   write through to Postgres. A request handler must `await` the durable write before
   responding (no lost writes on crash). Postgres is required — the server fails fast
   without `DATABASE_URL`.

6. **Non-critical state is write-behind but bounded.** Activity narration and `lastUsedAt`
   are fire-and-forget (`.catch(log)`) so they never block a broadcast — but anything
   append-only MUST be bounded (activity is trimmed to the newest `CAP` per project).

## Realtime broadcast

`onChange` carries a `ChangeEvent`: a **board** mutation pushes only the changed project
(`{type:'project'}`) to clients that can see it; an **org-board** mutation pushes only that
board (`{type:'orgboard'}`) to the org owner's sessions and map-share viewers; a **catalog**
lifecycle change (including org-board deletes) resyncs the scoped root. Never broadcast the
whole root on a board edit.

## Search

`src/shared/board.searchableItems(data)` is the **single** definition of what is searchable.
`searchBoard` (in-memory) and the Postgres `search_items` projection (`searchRows`) both use
it — do not hand-copy field lists. The projection is rebuilt on every `saveProject`.

## Recipes

- **New board command**: add the variant to `Command` + a case in `applyCommand`
  (`src/shared/board.ts`). It flows through the aggregate automatically. Add an `activity`
  `describe()` line if it should appear in the feed. If it adds searchable text, extend
  `searchableItems`.
- **New MCP tool**: register in `mcp.ts`; read via `await requireProj(projectId)` /
  `getCatalog()` / `searchOrg()`; write via `await applyAndBroadcast(...)`. Never call a
  repository from a tool.
- **New org-board command**: add the variant to `Command` + a case in `applyCommand`, add its
  type string to `ORG_BOARD_CMDS` (`state.ts`) and an authz case in `scope.authorizeCommand`
  (boardId → org via the injectable `boardOrg` resolver). If humans should see it in a
  project's feed, extend `noteOrgBoardChange`. Validation rules live in
  `src/shared/orgboard.orgBoardIssues` (pure — the caller resolves features via lookup).
- **New table / column**: edit `infra/schema.ts`, run `npm run db:generate`, commit the SQL
  under `infra/migrations`. Migrations run automatically at boot.

## Strictness

- `npm run typecheck:server` type-checks the whole server (it is **not** part of the web
  `tsc -b`); CI runs it, the web build, and `npm test` (with a Postgres service) and **gates
  the image build/deploy** on them. Keep the server type-clean.
- Tests live next to the code (`*.test.ts`, `tsx --test`). DB-backed tests skip when
  `DATABASE_URL` is unset; pure logic (registry, reducer) always runs.
