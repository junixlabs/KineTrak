# mockups — drawing the screens before building them

Read when: `uxcli init` says a screen has no mockup or no pick, or `context show` names states that
nobody has drawn. A mockup is a page you draw; a pick is a person's choice among your drawings; the
picked variant is what you build.

A project can make this step part of done: with `project.design: drawn` in its policy, a journey walk
exits 3 while a screen it passed through has fewer than two drawings or no complete lens review; with
`picked`, also until a person has picked. Drawing and reviewing are yours to do; the pick is not.

## What a mockup is

One static HTML file per variant of a screen, at `.uxcli/mockups/<state>/<variant>.html`, where
`<state>` is a state the journey declares (`agent.lead_detail`) and `<variant>` is a short name that
says what makes it different (`a-stacked`, `b-call-first`). Self-contained: inline CSS, no script it
needs, real words from the product and the actor, never lorem ipsum. Two or three variants per
screen; more is a list, not a choice.

Use the same `data-uxcli` hooks the journey names on the elements that play those parts —
`[data-uxcli=call-action]` on the call button, `[data-uxcli=lead-phone]` on the number. `uxcli
mockups` photographs each variant at the run viewport (default 390×844) and looks for the hook the
next step leaves from; a variant without it is drawn with the connection leaving from its edge and a
note saying which hook is missing. Hooks in the mockup are hooks in the build: whoever builds the
picked variant keeps them.

## Notes on the drawing, and more than one viewport

Say what a part of the drawing is for on the element itself: `data-uxcli-note="the call action stays
above the fold (C-001)"`. `uxcli mockups` numbers each note as a pin at that element's place on the
frame and lists the texts under the picture; the person deciding reads the drawing and the reasons
in one place. A note below the fold pins to the bottom edge. Photograph at more than one viewport
with `--viewport=1440x900,390x844`: the first is where the flow, the hooks and the pins are read,
the rest are pictured beside it, so a desktop drawing shows what it does on a phone before anyone
decides it is desktop-only.

## Reference pictures

A picture someone made of the screen — a style frame from an image model, a sketch, a competitor's
page — goes in `.uxcli/mockups/<state>/refs/<name>.png`. `uxcli mockups` shows it under that
screen's variants, labelled `reference`, and opens it large on click. It is never a variant: it
carries no hooks, it cannot be picked, and its hash is not part of any pick. Draw the variant it
inspires; the reference stays beside it so the person deciding sees where the drawing came from.

## What you say about the drawings

Write `.uxcli/mockups/<state>/about.json` beside the variants: `question` is what the person on
this screen is trying to do, in one sentence, and `variants` says in one sentence each what that
drawing does differently from the others. The page shows both above and under the drawings, so the
person deciding reads what differs before they compare pixels. Describe the drawing; do not
recommend one. It is not hashed and never a pick. Shape: `schemas/about.schema.json`.

## Shared tokens

When the screens share a palette, put it once in `.uxcli/mockups/_shared/tokens.css` as custom
properties and link it from each variant with `<link rel="stylesheet" href="../_shared/tokens.css">`.
The file is part of the drawing: the pick's `sha256` covers the variant and every shared file it
links, so changing a token is changing the picked drawing, and the receipt says which colours a
variant paints that no shared token carries (`2 colours off the shared palette: #0f6b4f #b06a00`).
A variant that deliberately leaves the palette says so in its name or a comment; one that drifts
from it by accident is what the line is for.

## What a pick is

```
.uxcli/mockups/agent.lead_detail/pick.json
{ "schema_version": 1,
  "pick": "b-call-first",
  "sha256": "<sha256 of b-call-first.html — uxcli mockups prints it under each unpicked variant>",
  "parts": { "a-stacked": "the full requirement block" },
  "by": { "type": "role", "ref": "product-owner" },
  "note": "The call action must be on screen without scrolling (C-001).",
  "when": "2026-09-28" }
```

`pick` names the variant that gets built and `sha256` names the drawing as it was when chosen: if
the file changes afterwards the pick is stale and refused until someone looks again and updates
the hash. `parts` names what was taken from another variant into it. `by` names who stands behind
the choice; without it the pick is refused. Shape: `schemas/pick.schema.json`; example:
`examples/crm/.uxcli/mockups/`.

A person may choose none. `revise.json` says so: `note` is what should change, `seen` names each
drawing by its hash as they looked at it, and `by` names who asked. Redraw to the note; once a
drawing's hash moves or a variant comes or goes, the request counts as answered and the screen is
open again. You never write it on your own judgement either. Shape: `schemas/revise.schema.json`.

Every variant gets a receipt on the card: the hooks the screen wants (its own signals and what
leaves it) found or missing, whether the file reaches for anything over the network, whether
it carries lorem ipsum, and, when the project shares tokens, which colours are off the palette. A
pick over a variant that fails its receipt is refused; an off-palette colour is reported, not refused.

## The sequence

1. `uxcli context show <journey>`: the states the screen must hold and the hooks each needs.
2. Draw each state's variants into `.uxcli/mockups/<state>/`.
3. `uxcli mockups` — the page it prints shows one screen at a time: what the person does there,
   one drawing as large as the page allows with what `about.json` says of it, A and B flipped in
   place (keys 1, 2) or side by side, and a bar with your lens review, `Neither, ask for a
   revision` and a `Choose` per drawing. The sidebar lists every screen, decided or open, and each
   journey's flow of picked screens, where `▶ Play the flow` walks it as a prototype. Receipts,
   hashes and rule ids sit under technical details. Open it, or give its path to the person deciding.
4. A person decides: a button fills a bar with the `pick.json` or `revise.json` to write, hashes
   included; they write it (or say so, and you write it with `note` naming them). Then build the
   picked variant, or redraw to the revision, and `uxcli run` measures the build.

You draw the variants and you never write `pick.json` on your own judgement: a pick is a person's, or you write it on a person's say-so and `note` names who said so. You never draw a variant that drops a hook the journey names in order to make the screen simpler. You never build a screen that has variants and no pick.

## When the journey changes

A new state is a new screen with no mockup; `uxcli init` says so. A state that was renamed leaves
its mockups under the old name, unread, and the new name with none. Move them; the pick moves with
them only if the variants are the same drawings.
