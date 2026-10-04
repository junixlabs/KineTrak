# versions — proposing a better version, and showing it is better

Read when: a walk of a journey showed something worth changing, or you are about to change a screen
that a journey goes through. A version names one walk so it is kept; a redesign proposal says what to
change and points at the evidence; the next version is compared with the last, step by step.

## The loop

```bash
npx -y @junixlabs/uxcli run .uxcli/journeys/<id>.json             # walk it
npx -y @junixlabs/uxcli experience --page                          # what the person goes through, pinned on screenshots
npx -y @junixlabs/uxcli version save <id> v1 --note="as it is"     # name that walk; it is kept against pruning
# write the redesign proposal (below); a person approves it; draw and build the change
npx -y @junixlabs/uxcli run .uxcli/journeys/<id>.json
npx -y @junixlabs/uxcli version save <id> v2 --note="call button above the fold" --proposal=proposals/P-0012.json
npx -y @junixlabs/uxcli experience --journey=<id> --from=v1 --to=v2 --page   # both pictures of every step, what moved
```

## A redesign proposal

`.uxcli/proposals/P-xxxx.json` with `"kind": "redesign"`, `target` naming the journey and step
(`journeys/<id>.json#<step>`), `statement` saying what changes for the person, and `evidence[]` citing
what the walk showed — one entry per finding it answers:

```json
{ "run": "runs/R-…", "check": "experience.reach", "observed": "[data-uxcli=call-action] 2 scrolls away at 390x844", "what": "the call button is below the fold on a phone" }
```

A proposal with no evidence is an opinion; cite the walk, the lens viewpoint, or the insight it rests
on. A person approves it before it is built. Name the version that answers it with `--proposal`.

## Saying it is better

Report the comparison in its own words: the steps, typing, scrolls and estimate that moved, the
findings that went away and the ones that appeared. A version with fewer findings and a higher
estimate is not simply better; say both. The metrics are findings, not verdicts, and nobody was
watched: a better walk is evidence for the change, not proof that people prefer it.

## What you do not do

- Rewrite or delete a version. A new walk gets a new name.
- Save a version of a walk you did not make on the final files.
- Call a change better without the comparison, or show only the numbers that improved.
