---
name: kinetrak-implement
description: >-
  Use to EXECUTE an approved swimlane plan on a KineTrak board — the inner build loop. Fires when
  the user wants to implement/build/work through the steps of a feature, continue in-progress work,
  or "do the next step", and after kinetrak-decompose. Works through swimlane steps one at a time,
  doing the real work with your own file/test tools and flipping each step's status with evidence so
  the human watching the board sees live progress.
allowed-tools: >-
  Read, Grep, Glob, mcp__kinetrak__get_board, mcp__kinetrak__get_changes_since,
  mcp__kinetrak__search, mcp__kinetrak__validate_board, mcp__kinetrak__update_swim_node,
  mcp__kinetrak__append_note, mcp__kinetrak__log_activity, mcp__kinetrak__create_snapshot,
  mcp__kinetrak__get_org_board, mcp__kinetrak__update_org_board_edge,
  mcp__kinetrak__link_org_edge_code,
  mcp__kinetrak__report_friction
---

# kinetrak-implement

Execute an approved plan, one swimlane step at a time, recording evidence on the board. Canonical
process: `docs/AGENT_PLAYBOOK.md` §2 (step 4). Tiers: `../_shared/tier-rules.md`.

## Preconditions

The feature has a swimlane plan (`kinetrak-decompose` done) and you have oriented this session.

> Code edits and shell/test runs (`Edit`, `Write`, `Bash`) are intentionally **not** pre-approved
> by this skill — they follow your normal permission settings, so destructive shell work is never
> silently auto-run. Board updates (additive) flow freely.

## The inner loop

For each step in the plan, in order:

1. **Pick the next `todo` step.** Set it to `progress` (`update_swim_node`). Skip/park anything
   `blocked` until its blocker clears.
2. **Do the work** with your own tools — write code, run the tests/build. Prefer TDD: a failing
   test first, then make it pass.
3. **Record evidence** — `append_note` on the step with the concrete proof: the test that passed,
   the command run, the file(s) touched.
4. **Advance status** — `update_swim_node` → `done` when the step's work is verified, or `blocked`
   (with a note saying why) if you are stuck.
5. **Keep integration contracts true.** If the step changed how this project talks to another
   system (endpoint, event, payload), update the org-board edge in the same pass:
   `update_org_board_edge` with the new contract `desc`, and `link_org_edge_code` the implementing
   file(s) so drift detection watches them. (Convention: `docs/AGENT_PLAYBOOK.md` §1.7.)
6. **Narrate** — `log_activity` so the human follows along live.
7. **Checkpoint at milestones** — `create_snapshot` when a meaningful cluster completes, and always
   before a wide or risky batch. Not after every single step.

Stay in sync on long runs with `get_changes_since` rather than reloading the whole board.

## Boundaries

- Additive board writes only. Any `delete_*` or restructuring is Tier 4 — stop and ask
  (`../_shared/tier-rules.md`).
- Do not promote the feature to shipped here — that is `kinetrak-ship`, behind a human gate.

## Terminal state

When every step of the feature's plan is `done`, the valid next step is `kinetrak-validate`. If you
hit a blocker you cannot resolve, narrate it and hand back to the human.
