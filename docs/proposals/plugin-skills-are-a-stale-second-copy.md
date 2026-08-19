# `plugin/kinetrak/skills/` is a stale second copy of `.claude/skills/`

Found while shipping ISS-2 (`report_friction`), on review round 2.

## What is true today

The repo carries **two** copies of the eight `kinetrak-*` skills:

- `.claude/skills/kinetrak-*/SKILL.md` — what agents working *this* repo load.
- `plugin/kinetrak/skills/kinetrak-*/SKILL.md` — what `plugin/kinetrak/.claude-plugin/plugin.json`
  publishes, and what `docs/SETUP_OTHER_PROJECTS.md` tells other projects to install.

Both `allowed-tools` lists are **enforcing**: a tool absent from the list is denied mid-skill. So
every MCP tool registration has to land in both trees or the plugin install silently loses the tool.
ISS-2 hit this twice — round 1 missed all eight `.claude/skills` copies, round 2 missed all eight
`plugin/` copies. `server/mcp.ts` now declares the lockstep as two `cm:edge` annotations, one per
tree, which makes the coupling visible but does not remove the duplication.

## The residual

The `plugin/` copies have drifted well beyond the one line ISS-2 added. They also lack:

- `mcp__kinetrak__ask_human` — the decision channel `report_friction` mirrors,
- the org-board tools (`list_org_boards`, `get_org_board`, `compute_org_impact`, …),
- whole body sections present in the `.claude/skills` originals.

Diff any pair to see it: `diff .claude/skills/kinetrak-specify/SKILL.md
plugin/kinetrak/skills/kinetrak-specify/SKILL.md`.

## What someone picking this up should decide

Not "sync the eight files once" — that is where the last two rounds already went. The question is
whether a hand-maintained second copy should exist at all. Either:

1. **Generate `plugin/` from `.claude/skills/` at build/publish time**, so drift is impossible and
   the two `cm:edge lockstep` annotations in `server/mcp.ts` collapse to one; or
2. **Publish `.claude/skills/` directly** and delete the duplicate tree.

Whichever way it goes, a check that fails when a registered `mcp__kinetrak__*` tool is missing from
a shipped allowlist is the part that stops this recurring — the annotations only tell a reader.
