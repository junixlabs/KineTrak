---
name: kinetrak-ship
description: >-
  Promote a validated feature to shipped on a KineTrak board and checkpoint it. Use after
  kinetrak-validate passes, when the human decides to ship/release/mark-done a feature. This is a
  Tier-4 action (a status promotion the human owns), so it is human-invoked only — never auto-fired.
disable-model-invocation: true
allowed-tools: >-
  mcp__kinetrak__list_projects, mcp__kinetrak__get_board, mcp__kinetrak__search,
  mcp__kinetrak__validate_board, mcp__kinetrak__update_feature, mcp__kinetrak__create_snapshot,
  mcp__kinetrak__log_activity, mcp__kinetrak__compute_org_impact,
  mcp__kinetrak__report_friction
---

# kinetrak-ship

Promote a validated feature to shipped and freeze a checkpoint. Canonical process:
`docs/AGENT_PLAYBOOK.md` §2 (step 6) and §6 (Tier 4). Tiers: `../_shared/tier-rules.md`.

## This is a Tier-4 gate

Shipping is a promotion the human owns — that is why this skill is `disable-model-invocation: true`
(the model never decides on its own to ship). Run it only when the human has invoked it on a
feature that **passed** `kinetrak-validate`.

## Preconditions (verify, then proceed)

- The feature's steps are all `done` and a passing validation note exists. If not, stop and route
  back to `kinetrak-validate` / `kinetrak-implement`.
- You have oriented this session.

## Steps

1. **Re-check integrity** — `validate_board`. Do not ship over `error`-severity issues.
2. **Cross-system check items** — `compute_org_impact({featureId})`: any integration this feature
   provides/consumes that is flagged `codeStale` goes into the ship note as an open check item
   (alert-only — it informs the human, it does not block the promotion).
3. **Promote** — `update_feature` → `status: done`. If the project uses releases, move the feature
   into the target release column (Story Map).
4. **Checkpoint** — `create_snapshot` with a named, dated label: `"v<n>: <feature> shipped"`. This
   is the immutable reference point for what shipped.
5. **Announce** — `log_activity("Shipped <feature>. Snapshot <label> created.")`.

## Terminal state

After shipping, run `kinetrak-session-close` if the session is ending, or return to
`kinetrak-specify` for the next feature.
