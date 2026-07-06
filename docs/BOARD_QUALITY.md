# Board Quality Contract

The single source of truth for what a well-formed KineTrak board looks like. The
invariants below are enforced defense-in-depth — at write time (the MCP tools refuse
to create bad state), at validation time (`validate_board`), and at checkpoint time
(`create_snapshot`). The playbook, `MCP.md`, `CONVENTIONS.md`, the skills, and the MCP
tool descriptions all restate rules from here; when they disagree, this file wins.

The invariants live in code at `src/shared/boardInvariants.ts` (pure, shared by server
+ client + tests). `validate_board` reports them via the shared `boardIssues()`
detector in `server/mcp.ts`.

## Every step belongs to a flow

**A swimlane step must have a `flowId`** = the id of the feature whose flow it is part
of. This is required by `add_swim_node` (and the `bulk_apply` `add_swim_node` op) — the
"legacy shared canvas" (a step with no flowId) is deprecated, because such a step
renders in *every* flow view and overlaps whatever flow you filter to.

`flowId` is **not** the same as `link_feature_step`:

| Mechanism | What it does |
|---|---|
| `flowId` (on the step) | Scopes the step to a *flow* (which swimlane sequence it belongs to) so the UI can filter the canvas to one flow, and so flows lay out in separate bands. |
| `link_feature_step` | Writes a bidirectional crossLink used by `compute_impact` to walk from a *feature* to the step that represents it. |

Set **both**. For a normal feature flow they point at the same feature. For a **backbone
flow** that spans several features (see the last section), `flowId` is the backbone's
host feature while each step is linked to the real feature it represents — so the two
legitimately differ. Both must reference *some* live feature; neither may be blank.

## The invariants

| # | Invariant | validate_board kind |
|---|---|---|
| I1 | Every step has a `flowId` pointing at a live feature | `unscoped_step` (+ `dangling_flow` if the feature is gone) |
| I2 | No two steps overlap in the same lane (within 40px on both axes) | `overlapping_steps` |
| I3 | Distinct flows occupy distinct x-bands (enforced by `arrange_swimlane`) | — (residual overlap → `overlapping_steps`) |
| I4 | An edge connects two steps of the *same* flow | `cross_flow_edge` |
| I5 | A `decision` step forks (≥2 outgoing branches) | `decision_no_branches` |
| I6 | Each flow has a `start` and an `end` step | `flow_no_start` / `flow_no_end` |
| I7 | A `done` feature has acceptance criteria, all checked (ssot only; steering feature exempt) | `done_without_acceptance` |
| I8 | Feature status agrees with its steps' statuses | `flow_lags_feature` / `feature_lags_flow` |
| I9 | Descriptions stay within the contract budget | `bloated_description` |

## Severity by board role

Severity is resolved from `settings.boardRole` (`severityFor` in
`boardInvariants.ts`):

- **`ssot`** (the board *is* the truth): I1, I2, I4, I5, I6 are **errors** — they make
  `validate_board` report `ok: false` and they **block `create_snapshot`** (a checkpoint
  must be valid). `next_action` routes you to `validate` while any error remains.
- **`map` / `asis-doc`** (truth lives elsewhere): the same invariants are **warnings**
  (advisory). I7 (definition-of-done) is only checked on `ssot`, since on `map`/`asis-doc`
  "done" means "exists elsewhere", not "acceptance met"; the steering / Project Context
  feature is exempt from I7.
- I7 and I9 stay warnings on every role.

## Layout: keep flows readable

`arrange_swimlane` with no `flowId` bands *every* flow into its own left→right x-range
(`arrangeAllFlows` in `src/lib/swimlayout.ts`), so the All-flows view reads as separate
bands instead of graphs stacked on a shared origin. Scoped `arrange_swimlane({flowId})`
tidies one flow while leaving the others where they sit. New steps are placed clear of
existing steps in their lane; run `arrange_swimlane` after a batch to band things
properly.

## If a flow spans more than one feature

A flow is scoped to exactly one feature. An operational backbone that crosses features
(e.g. login → authz → … → deal) still needs a home: create a dedicated feature to host
it (an "operational backbone" feature in the relevant module) and give every step that
feature's `flowId`. Do not leave it unscoped.
