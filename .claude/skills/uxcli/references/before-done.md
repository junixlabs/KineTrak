# before-done — what to do before saying UI work is finished

Read when: you are about to say a screen, form or flow is done.

You changed an interface. Before you say the work is finished, you measure it. The party that wrote
the interface does not get to declare it correct; the instrument does. This is the sequence, and it
ends with a word you may or may not say.

## Exit 0 is the floor, not the finish

`uxcli run` exits 0 when no probe reports `fail`, 2 when at least one does, 1 when it could not run. You say done only after a run you made yourself, on the final state of the files, exited 0. A `fail` blocks the word done until it is fixed and re-measured, or until the human has seen it and decided; in that case you report the fail, you do not report done. A `finding` is not a pass: it is a would-be fail from a probe whose method is not yet validated. Name it as a finding and say what it says; never fold it into "passes" or "no issues". `unmeasurable` and `not-applicable` are not passes either.

A journey walk can also exit 3 (`DESIGN STEP OPEN`): it found no fail, but the project's policy holds the work to a design step (`project.design`) that a walked screen has not had — two variants and a lens review, or under `picked` a person's pick. Exit 3 is not a verdict on the interface; it is the work not being finished, and it blocks the word done like any exit that is not 0.

## What exit 0 does not cover

`uxcli run <url>` runs five probes, and only these: `focus-visible` (2.4.7), `contrast` (1.4.3),
`text-spacing` (1.4.12) — three WCAG criteria whose method is validated — `text-overlap`, which
is provenance `opinion`, and `nesting` (a box inside a box inside a box), provenance `research`;
both are method-unproven, so they can only ever report a `finding`. A journey run
measures the states the journey declares and the commitments signed over it; a commitment whose
method is unproven can only report a `finding`.

So exit 0 means: those probes found no `fail`. It is not a statement about the interface. Nothing in
uxcli measures whether a control's visible label agrees with the state it reports, where focus lands
after an action, whether feedback appears where the person is looking, the heading outline, the tab
order, or whether something that can be clicked looks like it can. A page can return exit 0 with its
navigation scrolling off the top of the screen — measured on a page of this instrument's own.

Report exit 0 as what it is: the probes that ran, and what they found. If you are asked whether the
UI is good, that is a different question and this instrument did not answer it.

## How to work

1. List what you touched: the URLs of the screens whose markup or styles changed, and every journey
   under `.uxcli/journeys/` whose steps go through those screens.
2. Run `uxcli run .uxcli/journeys/<id>.json` for each journey and `uxcli run <url> --prove` for each
   screen. If the project has `uxcli.commitments.json` (design-token thresholds), run `uxcli sheet --src=<source dir>` too.
3. Read each card. For a `fail`: fix the element the card cites, then run again. If the fix is not
   yours to make (a design token, a copy decision), stop and report the card verbatim. For a
   `finding`: report it as a finding with the probe's own words. For `unmeasurable`: say what the card
   says could not be measured; do not retry until it passes.
4. Report with the card, not a paraphrase: probe or commitment, verdict, `what`, `where`, `check`.
   Then the exit code of the last run and the packet path it printed.
5. Read the screen through its lens (`references/lenses.md`) and run `uxcli review check`. Report
   what the review says breaks, as the review's claim, beside the run's verdicts.
6. Say done only if that exit code was 0, and say what was measured. If anything else, say what
   stands in the way.

## What you do not do

- Say done without a run in this session on the final files.
- Call a `finding`, `unmeasurable`, or `not-applicable` a pass.
- Edit the journey, a commitment, or a probe to make a run pass. Those belong to the human.
- Skip a screen because "it looked right in the browser". The browser shows you one state; the probe
  presses Tab, plants a defect, and reads the pixels back.
- Argue a verdict down. If you can show the card is wrong, say so to the owner with the run directory
  (`run.json` and `artifacts/`); the owner disputes it where the card says. Until then the verdict stands.
