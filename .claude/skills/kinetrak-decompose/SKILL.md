---
name: kinetrak-decompose
description: >-
  Use AFTER a feature spec is approved on a KineTrak board — to turn it into an ordered, visible
  execution plan on the Swimlane. Fires when the user wants to break a feature into steps/tasks,
  plan the implementation, lay out the workflow, or "decompose"/"map the steps", and right after
  kinetrak-specify. Produces swimlane nodes connected by edges so the plan is visible to the human
  before any code is written.
allowed-tools: >-
  mcp__kinetrak__list_projects, mcp__kinetrak__get_board, mcp__kinetrak__search,
  mcp__kinetrak__add_swim_node, mcp__kinetrak__add_swim_edge, mcp__kinetrak__arrange_swimlane,
  mcp__kinetrak__update_swim_node, mcp__kinetrak__append_note, mcp__kinetrak__log_activity
---

# kinetrak-decompose

Turn an approved feature spec into an ordered swimlane plan. Canonical process:
`docs/AGENT_PLAYBOOK.md` §2 (step 3). Tiers: `../_shared/tier-rules.md`.

## Preconditions

The feature has a spec (`kinetrak-specify` done) and you have oriented this session. Read the
feature's description and acceptance criteria first (`get_board` / `search`).

## Steps

1. **Identify the lanes.** Read the board's existing `lanes` (each has a numeric `lane` id). Place
   steps in the lane that owns that kind of work.

2. **Create the steps.** `add_swim_node` for each discrete step of the plan, in execution order.
   Give each a clear `label` and the right `kind` (`start` / `process` / `decision` / `end`).
   **Keep it to ~7 steps per pass** — if the feature needs more, it is two features; split it and
   spec the second separately.

3. **Connect the flow.** `add_swim_edge` from each step to the next so the execution path is
   explicit. Use `branch` labels on edges out of a `decision` node.

4. **Tidy the layout.** Call `arrange_swimlane` once to lay the steps out left→right by flow depth.

5. **Link back to the feature.** Note the parent feature on each step (`append_note` or in the step
   `desc` via `update_swim_node`) for traceability.

6. **Leave steps `todo`.** Do not start work here — decomposition only produces the plan.

7. **Narrate** — `log_activity`: which feature you planned and how many steps.

## Human gate

Present the swimlane plan to the human for review before implementation. Adding nodes/edges is
Tier 2, but the plan as a whole is a checkpoint — let them sanity-check the steps and order.

## Terminal state

After the plan is approved, the valid next step is `kinetrak-implement`. Do not begin coding from
within this skill.
