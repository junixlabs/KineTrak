---
name: kinetrak-validate
description: >-
  Use when a feature's swimlane steps are all done on a KineTrak board — to review the work against
  its acceptance criteria with fresh eyes before shipping. Fires when the user wants to verify,
  validate, review, or QA a feature, check it meets the spec, or "is this done?", and after
  kinetrak-implement. Ideally run in a fresh session or subagent that did not write the code, so the
  review is not biased by the implementation's reasoning.
allowed-tools: >-
  Read, Grep, Glob, mcp__kinetrak__list_projects, mcp__kinetrak__get_board, mcp__kinetrak__search,
  mcp__kinetrak__validate_board, mcp__kinetrak__update_swim_node, mcp__kinetrak__update_feature,
  mcp__kinetrak__check_acceptance, mcp__kinetrak__append_note, mcp__kinetrak__log_activity
---

# kinetrak-validate

Fresh-eyes review of a completed feature against its spec. Canonical process:
`docs/AGENT_PLAYBOOK.md` §2 (step 5). Tiers: `../_shared/tier-rules.md`.

## Run it cold

For an honest review, prefer a **fresh session or a subagent** that did not implement the feature —
a reviewer biased by the build's reasoning misses its own gaps. Load context from the board, not
from implementation memory.

## Steps

1. **Re-read the contract.** Load the feature (`get_board` / `search`) and read its acceptance
   criteria / `validations` — the conditions written at `kinetrak-specify`.

2. **Structural + quality check.** `validate_board` — surface orphan features, dangling edges,
   disconnected or mislaned steps, and the board-quality invariants (`docs/BOARD_QUALITY.md`):
   `unscoped_step` (a step with no `flowId`), `overlapping_steps`, `cross_flow_edge`,
   `decision_no_branches`, `flow_no_start`/`flow_no_end`, `done_without_acceptance`. On an **ssot**
   board the structural ones are errors that block `create_snapshot` until
   fixed; on `map`/`asis-doc` they are warnings. Run `arrange_swimlane` to clear
   `overlapping_steps`. (Fixing some structural issues is Tier 4 — flag, do not silently delete.)

3. **Check the work against each acceptance criterion.** Inspect the code (`Read`/`Grep`/`Glob`)
   and, if needed, re-run the tests (your own tools follow normal permissions). Confirm
   cross-references resolve (`search`). For each criterion you verified, tick it off with
   `check_acceptance({target:'feature', id, index, done:true})` — the board tracks done/total
   structurally, and an unmet criterion keeps the feature's live "Definition of Done" alert up so it
   cannot be shipped by mistake.

4. **Record the verdict** — `append_note` on the feature with a clear PASS/FAIL per criterion and
   any gaps found. This note is the review signal the human reads.

5. **Mark review state.** Per `docs/AGENT_PLAYBOOK.md` §5, "in review" = all steps `done` + a
   validation note present (there is no dedicated status). Keep the feature `progress` until it
   ships; do not set `done` here.

6. **Narrate** — `log_activity` the outcome.

## Human gate

The human reads the validation note (Activity feed + feature card) and decides whether to ship.

## Terminal state

- **Pass** → the valid next step is `kinetrak-ship` (human-invoked).
- **Fail** → hand the gaps back to `kinetrak-implement` (reopen the relevant steps to `progress`
  with a note on what failed).
