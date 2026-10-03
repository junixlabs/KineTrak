# lenses — reading a screen the way named designers would

Read when: you have drawn mockup variants, or built or changed a screen, and before you say it is
done. A lens is a checklist of viewpoints from named designers (Nielsen, Norman, Krug, Baymard,
GOV.UK, Wathan & Schoger, Kennedy, Rams, Vignelli, Bringhurst, Butterick, Tufte, Rauno Freiberg,
Emil Kowalski, Apple, Material, Brignull and others), grouped by the kind of UI it is read against.
Every viewpoint carries its author, the work, the page and the words. The rules are theirs, not uxcli's,
and not yours.

The checklists are in this skill, one file per kind: `lenses/marketing.md`, `lenses/content.md`,
`lenses/data.md`, `lenses/workspace.md`, `lenses/shop.md`, `lenses/transaction.md`. Each viewpoint
there gives the rule, the source with its URL, the designer's words, what to do and not do, what to
look at, and the exceptions. `uxcli lens show <kind>` prints the same list; `review check` asks about
exactly that list.

## The kinds

| lens | read against |
|---|---|
| `marketing` | landing, pricing, feature pages: read once, persuade, one call to action |
| `content` | docs, articles, blogs, help centres: long text, read and navigated |
| `data` | dashboards, analytics, monitoring, reports: numbers read again and again |
| `workspace` | admin, CRUD, tables, settings, B2B tools: repeated work |
| `shop` | catalogues, search results, product pages: browse, compare, choose |
| `transaction` | checkout, sign-up, booking, onboarding, multi-step forms: one task, once, correctly |

Pick the lens by what the person does on the screen, not by what the product is: a SaaS product has
a `marketing` landing, a `workspace` settings page and a `transaction` sign-up. A screen that is two
kinds gets two reviews. Every lens is on unless `.uxcli/lenses.json` turns it off, with a name on it.

## The sequence — the checklist is validated, not recited

1. **Before you draw**, read `lenses/<kind>.md` top to bottom and draw to it. A rule you already
   know you are breaking is cheaper to fix in the drawing than in the review. A viewpoint marked
   *Counted by `page.<probe>`* is also measured by the instrument.
2. **After you draw** (or build), for each variant or screen:

   ```bash
   uxcli review <state>/<variant> --lens=<kind> --write            # a drawing
   uxcli review http://localhost:3000/checkout --name=checkout --lens=transaction --write   # a screen
   ```

   This writes an empty review with every viewpoint of the lens as a key. Fill **every** answer while
   looking at the picture `uxcli mockups` took (or a screenshot of the running screen), not at your
   source: `holds` with `where` (the element or region you looked at), `breaks` with `where` and
   `note` (what is wrong, in numbers when you can count them), or `n/a` with `note` (why this
   viewpoint has nothing to act on here). Sign `by` as `{type: agent, ref: <you>, onBehalfOf:
   <the person running you>}`.
3. `uxcli review check`. It refuses a review that leaves a viewpoint unanswered, answers one the lens
   does not carry, claims `holds` or `breaks` without `where`, says `n/a` without why, is signed by an
   agent on nobody's behalf, or is older than the drawing (the hash moved). It then runs every probe a
   `holds` rests on, on the drawing or the URL itself, and refuses the `holds` where the probe counted
   a break. Exit 0 means every review is complete, fresh, and not contradicted.
4. Fix what `breaks` in the drawing or the screen, redraw, and review again: a changed drawing makes
   its review stale, as it makes a pick stale. Report what still breaks, in the review's words.

## What a review is, and is not

A review is your claim to have looked, one viewpoint at a time, and it is shown as that: on the
mockups page as "data lens · 24 of 27 hold · 3 break", never as a verdict. It does not turn a `fail`
into a pass, it does not sign anything, and a person reads it next to the picture. `review check` exit
0 says the form is complete and no probe disagrees; it does not say the screen is good.

## What you do not do

- Answer from memory of what you wrote. Look at the picture. Aesthetic-usability (Kurosu & Kashimura,
  1995; NN/g, Moran 2024) says the one who made it will rate it kinder than it is.
- Change an answer to `holds` to make `review check` pass. Fix the drawing.
- Mark a viewpoint `n/a` because it is inconvenient. `n/a` is for a subject that is not on the screen
  (a chart rule on a page with no chart).
- Invent a viewpoint, cite a designer the lens does not, or turn a lens off. Turning one off is the
  project's decision, in `.uxcli/lenses.json` with `by`.
- Write `pick.json`. A review helps a person pick; it never picks.
