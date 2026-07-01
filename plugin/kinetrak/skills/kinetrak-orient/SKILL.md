---
name: kinetrak-orient
description: >-
  Use this FIRST, at the start of every KineTrak working session, before any other
  KineTrak skill or board edit — to recall current board state from the board (your
  memory) instead of guessing. Fires when resuming work on a KineTrak project or board,
  when the user says "continue" / "resume" / "what's the status" / "where were we", before
  specifying or implementing a feature, or whenever you are about to read or write a
  KineTrak board and have not loaded it this session. The board is the single source of
  truth — never edit it before orienting.
allowed-tools: >-
  mcp__kinetrak__list_projects, mcp__kinetrak__next_action, mcp__kinetrak__get_board,
  mcp__kinetrak__get_changes_since, mcp__kinetrak__search, mcp__kinetrak__validate_board,
  mcp__kinetrak__log_activity
---

# kinetrak-orient

Recall the current state of a KineTrak board before doing anything else. Canonical process:
`docs/AGENT_PLAYBOOK.md` §0, §1, §7.1.

## Prime rule

The board is your memory and the single source of truth — not this chat. **Recall before you
write.** Do not create, update, or delete anything on the board until you have oriented this
session.

## Steps

1. **Pick the project.** If the project id is unknown, call `list_projects` and choose the one the
   user means (ask if ambiguous).

   *Shortcut:* `next_action(projectId)` returns the latest cursor plus a recommended next step and
   skill in one call — a fast way to start. Still complete the read steps below for full context.

2. **Incremental recall first.** If you hold a cursor from earlier this session, or you find one on
   the board (step 3), call `get_changes_since(projectId, since=<cursor>)` — it returns only what
   changed plus a fresh `cursor`. This is cheaper than reloading the whole board.

3. **Cold start.** If you have no cursor, call `get_board(projectId)` once for the full structured
   context (modules, features, swimlane, releases). Then locate the **`Meta` module → `Project
   Context` feature** and read its description: domain, tech stack, conventions, recent decisions,
   and the last session's **`Cursor: <value>`** line. Hold that cursor for the rest of the session.

4. **Narrow.** If the user named a specific area, `search` for it so you load the relevant
   modules/features/steps precisely rather than scanning everything.

5. **Integrity check.** Call `validate_board(projectId)`. If it reports `error`-severity issues
   (orphan features, dangling edges, steps in missing lanes), surface them — fixing them may need
   to happen before new work, and some fixes are Tier-4 (deletes).

6. **Announce.** Call `log_activity(projectId, "<one line: what you are about to do>")` so the human
   watching the board live knows an agent is active.

## Output

Produce a short orientation summary for the session:

- **Project**: name + id.
- **Where things stand**: open/in-progress features, anything `blocked`, recent changes since the
  cursor.
- **Integrity**: clean, or the errors found.
- **Next action**: the single most sensible next step.

Keep the cursor in working memory; pass it on every subsequent `get_changes_since`.

## If `Project Context` does not exist

The board predates the convention. Note it in your summary and create it during the next write
pass (`find_or_create_module "Meta"` → `find_or_create_feature "Project Context"`), then record the
project's domain/stack/conventions there. Do not block orientation on this.

## Terminal state

After orienting, continue with the user's request or the appropriate lifecycle skill
(`kinetrak-specify`, `kinetrak-decompose`, `kinetrak-implement`, `kinetrak-validate`,
`kinetrak-ship`). If the target is an existing codebase that is **not yet on a board**, use
`kinetrak-onboard` instead — orientation has nothing to load yet.
