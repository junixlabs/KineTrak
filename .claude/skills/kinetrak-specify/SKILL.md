---
name: kinetrak-specify
description: >-
  Use BEFORE implementing any feature on a KineTrak board — to write the contract (goal, non-goals,
  constraints, acceptance criteria) into the feature node first. Fires when the user wants to plan,
  spec, define, or scope a new feature/capability, when starting work on a feature that has no
  description yet, or right after kinetrak-orient when the next step is to define what to build.
  Writing the spec before code is mandatory; the feature description IS the spec and is durable
  across sessions.
allowed-tools: >-
  mcp__kinetrak__list_projects, mcp__kinetrak__get_board, mcp__kinetrak__search,
  mcp__kinetrak__find_or_create_module, mcp__kinetrak__find_or_create_feature,
  mcp__kinetrak__update_feature, mcp__kinetrak__set_acceptance, mcp__kinetrak__append_note,
  mcp__kinetrak__log_activity
---

# kinetrak-specify

Write the contract for a piece of work into its feature node, before any implementation. Canonical
process: `docs/AGENT_PLAYBOOK.md` §2 (step 2). Tiers: `../_shared/tier-rules.md`.

## Preconditions

You must have oriented this session (`kinetrak-orient`). If not, orient first — never write to a
board you have not loaded.

## Steps

1. **Locate or create the feature.** `search` for it by name to avoid duplicates; if it does not
   exist, `find_or_create_feature` under the right module (`find_or_create_module` first if the
   module is missing). Resolve IDs fresh — never reuse one from a past session.

2. **Write the spec — follow the description contract (`docs/AGENT_PLAYBOOK.md` §1.6).** The `desc`
   holds only the tight **current contract**; the other parts go in their own fields:
   - **`desc`** (`update_feature`) — a 1–2 line **Goal** (outcome, present tense) + a 1-line
     **Non-goals** only if there's a real boundary risk (on an existing project: "preserve existing
     structure unless told otherwise"). Keep it ≤ ~700 chars / ~12 lines — a 3-second read. Do **not**
     restate status/constraints/acceptance/code here, and no legacy/backfill narration.
   - **Constraints** → the `constraints` array (not prose in `desc`).
   - **Acceptance criteria** → `set_acceptance` (the `validations` checklist). Make them concrete —
     `kinetrak-validate` ticks each with `check_acceptance` and unmet ones block ship (DoD alert).
   - When the spec changes later, **rewrite `desc`**, don't append; history goes below a `— log —`
     marker as terse dated notes (keep ~5).

3. **Set status to reflect intent** — `must` for committed work, `nice` for optional. (Lifecycle
   mapping: `docs/AGENT_PLAYBOOK.md` §5.)

4. **Record assumptions** with `append_note` (dated) if you had to decide something the user did
   not specify.

5. **Narrate** — `log_activity` a one-liner: which feature you specified and its goal.

## Human gate

Creating/updating a feature is Tier 3 — present the spec to the human and let them review the
goal, non-goals, and acceptance criteria before implementation begins. Apply corrections.

## Terminal state

After the spec is approved, the valid next step is `kinetrak-decompose` (turn the spec into an
ordered swimlane plan). Do not start implementing from within this skill.
