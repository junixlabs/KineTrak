# principles — proposing what the product commits to

Read when: a verdict is `not-committed` and the project should decide, or a threshold the product
should hold has no owner yet. A commitment is a promise with a named owner and a written source, and
uxcli says `fail` only against one.

## What a commitment is

One promise, one signature, one file: `.uxcli/commitments/C-xxxx.json`. `statement` in words;
`scope` (journey, workflow, step, state, viewports); `owner` (who stands behind it) and `approvedBy`;
`source` — `{ doc, quote }`, the document the promise comes from and the exact words in it;
`measurements[]` — each a `target` state, a `predicate` in the signal grammar (see `journey.md`), and
a `method` (`method-validated` may say fail; `method-unproven` may only say finding); `trace[]` to the
insight it rests on; `status: PROPOSED | ACTIVE | RETIREMENT_PROPOSED | RETIRED`. Shape:
`examples/crm/.uxcli/commitments/C-001.json`.

A commitment whose parts answer to different people is two commitments. A source without a quote is
a name, not a citation; the parser checks the words are still in the document.

Design-token thresholds (contrast between named tokens) live in the older `uxcli.commitments.json`
at the project root, read by `uxcli sheet`; the same rule holds: `owner` and `source`, or `not-committed`.

## How to work

1. Read what exists: the insight the promise rests on, the journey and state it applies to, the last
   run's card (the fail or finding names the place and the numbers), and any principles or design
   document the project has written.
2. State the fact and the choice, one line each: what the product does today at that place, what
   committing would mean, what would have to change. Example: `[data-uxcli=call-action] needs two
   scrolls at 390×844 today; committing inViewportWithoutScroll at 390 means moving the action above
   the history block on mobile.`
3. Write `.uxcli/proposals/P-xxxx.json` with `kind: commitment`, `proposedBy` (type `agent`, your
   name, `onBehalfOf` the person running you), `statement`, `trace[]`, `evidence[]` naming the run
   directory and its hash, `status: proposed`. Then, if the person running you says so, write the
   commitment file itself with `status: PROPOSED` and `owner`/`source` filled from the document they
   name; say in `proposedBy` that an agent wrote it and on whose say-so.
4. Print the trade-offs and end with what the person must do: approve (`approvedBy`, `status:
   ACTIVE`) or reject the proposal.

You write proposals. You never set `approvedBy`, never turn a proposal into `status: ACTIVE`, and never edit an ACTIVE commitment's measurements, unless the person running you says so in this session — and then the entry names them. A promise nobody stands behind is `not-committed`, and you report it as that, not as a pass.

## What you do not do

- Decide a threshold, pick a palette, judge taste. Silence is the correct output when nothing is written down.
- Propose an entry with no document to quote.
- Weaken a measurement to turn a fail into a pass. Retirement is a proposal with a reason, decided by someone with authority.
