---
name: uxcli
description: Measure UI work with real Chrome before saying it is done, and read the project's UX context (actor, insights, journey states, signed commitments) before designing a screen. Use whenever a task touches an interface — building or changing a screen, form or flow, being asked whether UI work is finished, or writing a journey, commitment or understanding file under .uxcli/. Carries named designers' checklists by kind of UI (marketing, content, data, workspace, shop, transaction) to draw to and review against. Returns exit codes and cited evidence; a review is the reviewer's claim, never a verdict.
license: MIT
metadata:
  version: "0.8"
  author: junixlabs
---

# uxcli

You are working on an interface, and this project measures interfaces with uxcli: a CLI that reads
what the project has declared about its users and journeys, drives real Chrome against the running
product, and returns a verdict as an exit code with the evidence behind it. The party that writes an
interface does not get to declare it correct; the instrument does. This skill is the sequence.

## Fast path

Use this bounded path for ordinary UI work. Read a reference only where a step names it.

1. **Find the instrument.** Run `npx -y @junixlabs/uxcli doctor` once per session. It says whether
   Chromium is present, whether this directory is a uxcli project, and the one command that fixes
   whatever is missing. A `doctor` that exits non-zero is the first thing to report, not to work around.
2. **Read before you design.** For the journey the screen belongs to:

   ```bash
   npx -y @junixlabs/uxcli context show <journey-id>
   ```

   The card prints the actor's `unknowns[]` first, then who they are, each insight at the confidence
   its evidence allows, the states the screen must be able to hold with the `data-uxcli` hooks each
   needs, the commitments already signed over it, and what the last run saw. Read it top to bottom.
   If there is no journey or no understanding on disk, the card says so; go to `references/understand.md`
   and `references/journey.md` before writing any UI.
   If you do not know the product's field from sources, research it first: `npx -y @junixlabs/uxcli
   template` names a starting point for the kind of product, and `references/research.md` is how.
3. **Draw before you build.** First pick the lens for what the person does on this screen —
   `marketing`, `content`, `data`, `workspace`, `shop` or `transaction` — and read its checklist,
   `lenses/<kind>.md` in this skill: named designers' rules, each with its source and what to look
   at. Draw to it. For each state the card names, draw two or three variants into
   `.uxcli/mockups/<state>/<variant>.html`, with the same `data-uxcli` hooks the journey names. Then:

   ```bash
   npx -y @junixlabs/uxcli mockups
   ```

   It photographs every variant, draws each journey as a flow of the picked ones, and prints the
   page. Then review each variant against that checklist, looking at the photograph: `uxcli review
   <state>/<variant> --lens=<kind> --write`, answer every viewpoint, redraw what breaks, and run
   `uxcli review check` until it exits 0; `references/lenses.md` is the sequence. A person picks in
   `pick.json`; you never pick for them. `references/mockups.md` is the shape.
4. **Build to the card.** Build the picked variant. Use the hooks and states the card names. Do not invent a hook, a state, or a fact
   about the user that the card does not carry. An unknown is not yours to fill: ask, or leave the gap
   visible in what you build.
5. **Measure the final files.** For every journey through the screens you touched, and every screen:

   ```bash
   npx -y @junixlabs/uxcli run .uxcli/journeys/<journey-id>.json
   npx -y @junixlabs/uxcli run <url-of-the-screen> --prove
   ```

   Read each card. A `fail` names the element, the place, the rule and how to check it yourself; fix
   that element and run again. Never edit a journey, a commitment or a probe to make a run pass.
   Then review the built screen through its lens, the same way, and `uxcli review check`.
   Then read what the person goes through: `npx -y @junixlabs/uxcli experience --page` — steps, clicks,
   typing, scrolls, waits and a keystroke-level estimate per journey, each finding pinned on the step's
   screenshot, and what moved since the walk before. Report each finding in its words; they never block.
   To see the whole board — every journey's screens as drawn, as built and per version, findings
   pinned — run `npx -y @junixlabs/uxcli studio --shot=.uxcli/studio/board.png` and look at the picture.
   When a person has to pick a drawing or look at the work, tell them to open
   `npx -y @junixlabs/uxcli studio --serve`: they pan and zoom it like a design file, choose a drawing or
   ask for a redraw there, and it refreshes as you change files. Their choice lands in `pick.json` or
   `revise.json`; read it from there.
6. **Say done only at exit 0**, and say what was measured. Anything else, say what stands in the way.
   `references/before-done.md` is the full sequence and the list of what exit 0 does not cover.

Before you design or change a screen, you read `uxcli context show` for the journey it belongs to, and you build to the hooks and states the card names. An unknown on that card is not yours to fill: you ask, or you leave the gap visible. After you change the screen, you run uxcli on the final files, and the word done is not yours until that run exits 0.

## Verdict router

| Card says | Do |
|---|---|
| `FAIL` | fix the element at `where`, run again; the cap and the commitment id tell you whose rule it is. Two runs in a row with no fewer fails: stop, report what is left in the card's words, and do not touch the declaration |
| `finding` | report it in the probe's words as a finding, never as a pass; fix the element if it is yours — the cap is on the method, not the defect |
| `not-committed` | nobody signed this; propose it (`references/principles.md`), do not sign it yourself |
| `unmeasurable` | say what could not be measured and why; do not retry until it passes |
| `not-applicable` | nothing to do here; the condition did not occur |
| `blocked` (exit 1) | no verdict was reached; read the reason and the `fix` line (identity, fixture, reach) and report it; this is not a UX fail |
| `DESIGN STEP OPEN` (exit 3) | the walk measured clean, but the policy holds this project to a design step and a walked screen has no drawing, review or pick; draw and review it, then ask the person to pick — never write a pick yourself without their say-so. Not done |
| exit 0 | no probe found a fail; report what ran and what it did not look at |

## Invariants

- The card is the argument. Report `what · where · rule · check` from the card, not a paraphrase.
- You propose; a person commits — or you sign on that person's say-so and the entry says so (`owner`,
  `source`, and who told you). Signing is never the act of erasing a verdict.
- uxcli writes no claim about the product. Every sentence on a card was authored by the project or
  measured by the browser. Do not add UX opinion to what it printed.
- Exit 0 is a floor. It is a statement about the probes that ran, not about the interface.
- Repair is bounded. One diagnosed element per fix, one run per fix; when two consecutive runs do not
  lower the fail count, the next message is a report, not another attempt.

## Read only these files

| Read | When |
|---|---|
| `references/before-done.md` | before you say UI work is finished; what exit 0 covers and does not |
| `references/journey.md` | the card says no journey, or a flow has changed shape: states as signals, hooks, workflows |
| `references/mockups.md` | a screen the journey names has no mockup or no pick: variants, hooks, `pick.json` |
| `references/understand.md` | the card says no understanding, or an insight the screen leans on is missing or a hypothesis |
| `references/walkthrough.md` | a journey was walked and you need to know whether a person could follow it: the four questions at every step, as one of the project's actors |
| `references/versions.md` | a walk showed something worth changing: naming versions, a redesign proposal with evidence, comparing two versions |
| `references/prefer.md` | two versions exist and someone asks which people would rather use: a blind pairwise study you prepare and people judge |
| `references/research.md` | you do not know the product's field from sources yet: where to look, what to come back with, how to write it down |
| `templates/<id>.md` | the product is a kind uxcli has a template for — `workspace`, `shop`, `landing`: screens and their lens, journeys to walk, what to research |
| `lenses/<kind>.md` | before you draw or change a screen: the checklist for its kind of UI — `marketing`, `content`, `data`, `workspace`, `shop`, `transaction` |
| `references/lenses.md` | how to pick the lens, answer it, write the review, and pass `review check` |
| `references/principles.md` | a verdict is `not-committed` and the project should decide; proposing a commitment |
| `examples/crm/.uxcli/` in the package | the shape of every file — take the shape, not the facts |

Do not read `src/` to decide what a verdict means; `uxcli why <rule>` prints a probe's definition.

## Setup and fallback

```bash
npx -y @junixlabs/uxcli doctor            # node, Chromium, project root, policy, level — and the fix
npx -y @junixlabs/uxcli demo <dir>        # a real product with a planted defect, run end to end: see a fail card in under a minute
npx -y @junixlabs/uxcli init --apply --origin=<url>   # a new project: rule file, this skill, .uxcli/ with the floor policy
npx -y @junixlabs/uxcli guide "<what you are about to do>"   # which command and which file, for a situation
```

Without Chromium, `run` cannot measure; `context show`, `init`, `migrate` and `guide` still work. Say
so rather than describing a screen you did not measure.

## Output

Return: the command you ran, the exit code, and the card's `what · where · rule · check` for every
verdict that is not `pass`. For every review, the lens, `review check`'s line and each `breaks` in the review's words. Name a `finding` as a finding. Do not claim exit 0 for a run you did not
make on the final files, and do not claim a visual review you did not perform.
