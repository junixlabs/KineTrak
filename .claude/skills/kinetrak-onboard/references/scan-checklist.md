# Scan checklist (B0)

A repeatable pass for understanding an existing codebase before mapping it. Read structure, not
every line — sample representative files. Stop when you can describe the system to someone else.

## 1. Orientation files (read first)

- `README*`, `CONTRIBUTING*`, `docs/` — stated purpose, setup, conventions.
- `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `pom.xml` — language, deps, scripts.
- `CLAUDE.md` / `AGENTS.md` / `.cursorrules` — existing agent conventions (honor them; do not
  duplicate into the board, link to them).
- CI config (`.github/workflows/`, etc.) — how it builds, tests, deploys.
- `docker-compose*`, `Dockerfile`, infra dirs — runtime topology.

## 2. Tech stack & how it runs

- Primary language(s) and framework(s).
- Entry point(s): server bootstrap, CLI main, app root.
- Datastore(s) and schema/migrations location.
- How to start it locally; how tests run.

## 3. Module / area boundaries → KineTrak modules

Use the repo's own structure as the source of truth for module boundaries (in priority order):

- Workspace packages / monorepo packages.
- Top-level source directories (`src/<area>`, `app/<area>`, `services/<svc>`).
- Bounded contexts / domains evident from naming.

Each becomes a candidate **module**. Prefer the structure the code already has over an idealized
one you invent.

## 4. Capabilities inside each area → KineTrak features

For each module, find the significant capabilities — the things the system *does*:

- Route groups / controllers / handlers.
- Exported services, use-cases, commands.
- Major UI views / screens.
- Background jobs, integrations.

Each meaningful capability becomes a candidate **feature**. Note its file path for traceability.
Skip trivia (one-line helpers, pure config) — features are user/product-meaningful, not every file.

## 5. Conventions & constraints

- Naming, formatting, lint rules.
- Testing approach (unit/integration/e2e; where tests live).
- Branch / PR / commit conventions.
- Known constraints, gotchas, or tech debt called out in comments/docs.

## 6. High-level data flow

One or two sentences: request → which layers → datastore → response; or the main pipeline. Enough
that the `Project Context` note orients a future session fast.

## Output of B0

A compact as-is summary covering: stack, module list (with paths), features per module (with
paths), conventions, constraints, and the data-flow sentence. This feeds B1 directly.
