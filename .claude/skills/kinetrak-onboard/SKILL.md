---
name: kinetrak-onboard
description: >-
  Use when pointing KineTrak at an EXISTING codebase that is not yet mapped on a board — to build
  the as-is map before any change. Fires when the user asks to onboard, import, map, or
  reverse-engineer an existing project/repo into KineTrak, to "set up a board for this codebase",
  or to "understand this project" in KineTrak. Scans the code, drafts an ADDITIVE Mindmap of the
  real modules and features plus a Project Context node, then STOPS for the human to confirm the
  map before anything changes. Do NOT use for a brand-new / greenfield project with no code yet —
  that is a discovery interview, not onboarding.
allowed-tools: >-
  Read, Grep, Glob, AskUserQuestion, mcp__kinetrak__list_projects, mcp__kinetrak__get_board,
  mcp__kinetrak__search, mcp__kinetrak__validate_board, mcp__kinetrak__find_or_create_module,
  mcp__kinetrak__find_or_create_feature, mcp__kinetrak__update_feature, mcp__kinetrak__update_module,
  mcp__kinetrak__create_snapshot, mcp__kinetrak__log_activity, mcp__kinetrak__append_note
---

# kinetrak-onboard

Map an existing codebase onto a KineTrak board, **as-is**, before changing anything. Canonical
process: `docs/AGENT_PLAYBOOK.md` §3.

## The one rule that governs everything here

**The diagram is the *output* of onboarding, not the tool that performs it.** You scan the code
with your own file tools, then write what you find onto the board. **Every board write in this
skill is additive** — `find_or_create_*`, `update_*`, `append_note`. You do **not** delete or
restructure anything. Reverse-engineering structure wrong and then "fixing" it destroys the
human's trust in the board.

Sequence: **B0 Scan → B1 Draft map → B2 Human gate → B3 Hand off.**

## B0 · Scan the codebase

Read the repository with `Glob`, `Grep`, and `Read` (not the board). Build a compact **as-is
summary**. Work through `references/scan-checklist.md`. Capture:

- Tech stack & build (languages, frameworks, package manifests, how it runs).
- The real module/area boundaries — top-level source dirs, packages, bounded contexts.
- The significant capabilities (features) inside each area.
- Conventions (naming, tests, branch/PR rules) and notable constraints.
- Entry points and how data flows at a high level.

Do not over-read. Sample representative files; you are after structure, not a line-by-line audit.

## B1 · Draft the map (additive only)

Pick the target project/org first (`list_projects`; ask the user which workspace if unclear). Then
translate the scan into board structure using the rules in `references/mindmap-mapping.md`:

1. `find_or_create_module` for each real area of the codebase. Use `update_module` for color/owners
   only if helpful.
2. `find_or_create_feature` for each significant capability inside its module. Put a one-line "what
   this is, where it lives in the repo (path)" in the feature description via `update_feature` —
   this is the traceability link back to code.
3. Create the **`Meta` module → `Project Context` feature** and write the as-is summary into its
   description (domain, stack, conventions, key constraints). This is the durable onboarding
   artifact future sessions read first.
4. `log_activity` a short narration as you go so the human sees the map taking shape live.

Set feature `status` to reflect reality: shipped/working capabilities → `done`; partial/in-flight →
`progress`. Do **not** invent features the code does not have.

## B2 · Human gate (mandatory, synchronous)

This is a hard stop. Present the drafted map back to the human — the modules, the features under
each, and the `Project Context` summary — and ask them to confirm it matches reality. Use
`AskUserQuestion` for specific uncertainties (e.g. "Is X one module or two?").

- Apply their corrections (still additive / `update_*`; if something must be removed, that is a
  Tier-4 delete — ask explicitly, do not do it silently).
- Once confirmed, baseline it: `create_snapshot("v0: as-is")`. Every later change is now diffable
  against this baseline.

Do not proceed past B2 without confirmation.

## B3 · Hand off

Onboarding is complete. Record the resume cursor and a next-step line on `Project Context`
(`append_note`). For any actual development that follows, enter the normal lifecycle — start with
`kinetrak-specify`. After B2, **restructuring existing modules/features is a Tier-4 action**
(`docs/AGENT_PLAYBOOK.md` §6); default to additive, scoped changes.

## Terminal state

The valid next step after a confirmed onboarding is `kinetrak-specify` (or the user's explicit
request). Do not begin implementing changes from within this skill.
