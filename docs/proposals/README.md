# Proposals

Residuals found while shipping an issue that no single diff could carry. One line each; a proposal
is not a tracked task — it is a note for whoever picks the area up next.

| Topic | Found while | Note |
|---|---|---|
| [`lint-script-has-no-linter`](lint-script-has-no-linter.md) | ISS-2 (`report_friction`) | `npm run lint` cannot work on a fresh clone — no `eslint` dependency and no config exist. |
| [`plugin-skills-are-a-stale-second-copy`](plugin-skills-are-a-stale-second-copy.md) | ISS-2 (`report_friction`) | `plugin/kinetrak/skills/` duplicates `.claude/skills/` and has drifted; every tool registration must edit both enforcing allowlists. |
