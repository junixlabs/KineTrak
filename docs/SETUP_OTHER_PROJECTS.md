# Using KineTrak on another project

A checklist for pointing the KineTrak agent playbook + skills at one of your other
codebases. Two layers matter:

- **Layer A — the playbook rides the MCP server.** Just connecting the `kinetrak` MCP server gives
  any agent the process (server `instructions`, sharpened tool descriptions, and the
  `orient` / `onboard` / `ship` prompts). Nothing to copy.
- **Layer B — the skills** (`.claude/skills/kinetrak-*`) are the optional, richer Claude Code
  workflows. Install once at user scope to get them in every repo.

---

## A. One-time install (works for every project)

- [ ] **Add the KineTrak MCP server at user scope:**
  ```bash
  claude mcp add --transport http kinetrak https://kinetrak.thejunix.com/mcp \
    --header "Authorization: Bearer <API_KEY>" -s user
  ```
- [ ] **Install the skills + shared reference at user scope** (keep the folder layout so each
  skill's `../_shared/tier-rules.md` resolves):
  ```bash
  cp -r <kinetrak-repo>/.claude/skills/kinetrak-* ~/.claude/skills/
  cp -r <kinetrak-repo>/.claude/skills/_shared     ~/.claude/skills/
  ```
- [ ] *(Optional)* Copy `docs/AGENT_PLAYBOOK.md` somewhere the skills can reference. If absent,
  Layer A still carries the condensed playbook from the MCP server.

## B. Per new project — the KineTrak board (hosted)

Decide the workspace model first (see **Notes**), then:

- [ ] Open `kinetrak.thejunix.com` → **create a workspace** (org) for the project, or reuse one.
- [ ] **Create the project.** Either let the agent do it (the `kinetrak-onboard` skill calls the
  `create_project` MCP tool when the workspace has none), or create it yourself in the web UI.
- [ ] On the **Connect** page, **mint an API key scoped to that workspace**. A key only ever sees
  the projects in its own workspace.
- [ ] If you want **one workspace/key per project**, register a named server for that key:
  ```bash
  claude mcp add --transport http kinetrak-acme https://kinetrak.thejunix.com/mcp \
    --header "Authorization: Bearer <KEY_ACME>" -s user
  ```
  If you keep **one workspace with many projects + one key**, add nothing — the agent picks the
  right `projectId` via `list_projects`.

## C. First run inside the project repo

- [ ] Open Claude Code **locally** in the repo (local sessions load MCP tools normally — see the
  remote caveat in **Notes**).
- [ ] **Existing codebase** → run `kinetrak-onboard`: the agent scans the code, drafts an additive
  map + a `Meta / Project Context` node, **stops for you to confirm it (gate B2)**, then snapshots
  `v0: as-is`.
- [ ] **Brand-new project** → describe the idea; the agent interviews you, builds the initial
  Mindmap + first release + Project Context, then snapshots `v0`.

## D. Every session

- [ ] **Start:** `kinetrak-orient` — recall the board / `Project Context` before any edit.
- [ ] **Work:** specify → decompose → implement → validate → ship (each with its human gate;
  `ship` is human-invoked).
- [ ] **End:** `kinetrak-session-close` — write a summary + next step + cursor onto
  `Project Context` so the next session resumes incrementally.

---

## Notes & gotchas

- **Key scope = one workspace.** Recommended default: one workspace per area/client holding several
  projects, one key — the agent targets the right `projectId`. Use one-workspace-per-project only
  when you need stronger isolation.
- **Layer A is automatic.** Connecting the MCP server is enough to get the playbook; the skills are
  an optional upgrade.
- **Single process only.** Don't run more than one KineTrak server instance against the same
  database (see README → *Operating constraints*).
- **Remote-session caveat.** In a *remote* Claude Code session the `mcp__kinetrak__*` tools may not
  load even when `claude mcp list` shows the server connected. Local sessions are fine. As a
  fallback, drive the board over the MCP HTTP endpoint directly (initialize → `notifications/initialized`
  → `tools/call`, with a `User-Agent: curl/...` header so Cloudflare doesn't 403).
- **The board is the memory.** Read before you write; additive by default; `delete_*` and `ship`
  are Tier-4 (confirm first). Full process: `docs/AGENT_PLAYBOOK.md`.
