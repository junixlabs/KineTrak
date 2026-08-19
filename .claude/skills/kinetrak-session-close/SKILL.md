---
name: kinetrak-session-close
description: >-
  Use at the END of a KineTrak working session — to write the resume state back to the board before
  context is lost. Fires when wrapping up, when the user says "that's it for now" / "let's stop" /
  "save where we are" / "wrap up", or before a long pause. Records a session summary, the next step,
  and the latest cursor onto the Project Context node so the next session resumes incrementally.
allowed-tools: >-
  mcp__kinetrak__list_projects, mcp__kinetrak__get_board, mcp__kinetrak__get_changes_since,
  mcp__kinetrak__search, mcp__kinetrak__find_or_create_module, mcp__kinetrak__find_or_create_feature,
  mcp__kinetrak__append_note, mcp__kinetrak__create_snapshot, mcp__kinetrak__log_activity,
  mcp__kinetrak__report_friction
---

# kinetrak-session-close

Persist resume state to the board at session end. Canonical process: `docs/AGENT_PLAYBOOK.md` §7.3.

## Why

The board is the only handoff to the next session. Writing the summary + next step + cursor onto
`Project Context` lets the next session resume with incremental recall (`get_changes_since`) instead
of a cold full reload.

## Steps

1. **Get the latest cursor.** Call `get_changes_since` once more (or use the cursor you have held)
   so you record the most recent value.

2. **Update `Project Context`.** Find the `Meta` module → `Project Context` feature (create it with
   `find_or_create_*` if missing) and `append_note`:
   `"Session <date>: completed <X>. Next: <Y>. Cursor: <value>."`
   Keep it one line — it is a rolling handoff, not a journal.

3. **Compact what you touched.** For features/steps you edited this session, rewrite any rambling
   `desc` back to the tight contract and prune its `— log —` to ~5 entries (description contract,
   `docs/AGENT_PLAYBOOK.md` §1.6). `validate_board` flags `bloated_description`; the Overview lists
   them under "Descriptions to compact" — clear the ones you own.

4. **Settle integration contracts.** If you touched org-board edges this session, make sure each
   contract `desc` reflects the final state and nothing you reconciled is still flagged stale —
   the next session (possibly another project's agent) reads those edges as truth.

5. **Snapshot if significant.** If meaningful work shipped or large changes landed this session,
   `create_snapshot` with a named, dated label. Skip for trivial sessions.

6. **Sign off.** `log_activity("Session complete. Next session: <plan>.")`.

## Terminal state

This is a terminal skill — the session ends here. The next session begins with `kinetrak-orient`,
which reads the note you just wrote.
