# understand — writing who the product is for, with evidence

Read when: `context show` says there is no understanding on disk, or the screen leans on an insight
that is missing or a hypothesis. Understanding is what lets a journey say why it exists; uxcli reads
it back to you before you design, and validates its shape — it never writes a word of it.

## Two files

**Actor** — `.uxcli/understanding/actors/<actor>.json`: `actor` (the name journeys use), `roles[]`,
`contexts[]`, `jobs[]`, `behaviors[]`, `habits[]`, `expectations[]`, `pains[]`, `constraints[]`, and
`unknowns[]`. Behaviour, not persona: what they do, where, under what pressure. No name, age or hobby
unless it changes the product. `unknowns[]` is the most important field and may not be empty.

**Insight** — `.uxcli/understanding/insights/I-xxxx.json`: one `claim`; `about: domain | product |
actor:<name>`; `source { type, ref }` (analytics, interview, support ticket, a document, an observed
run — or `null`); `evidence[]` (the numbers or quotes, in words); `wouldChangeIf { kind: prose |
predicate, text }` — the observation that would show the claim wrong; `confidence`. Confidence is a
ceiling uxcli derives: no evidence → `hypothesis`; evidence without `wouldChangeIf` → `low`; a
falsifier never checked → `medium`; checked and did not fire → `high`. Whatever the file claims above
that, the card prints the ceiling and names the overclaim.

Shape: `examples/crm/.uxcli/understanding/`. Take the shape, not the facts.

## How to work

1. Gather what is actually in your hands: the source tree (routes, entities, copy), tickets, docs,
   analytics exports, interview notes, support logs, the running product. Each is a source with a
   `ref`. Model memory is not a source.
2. Write the actor from behaviour you can point at. A job or a pain you cannot trace to something you
   read goes into `unknowns[]`, in the form of the question that would settle it.
3. Write one insight per claim. Put the exact numbers or words into `evidence[]`; put the document or
   dataset into `source`. Write `wouldChangeIf` as the measurement that would make you retract it. A
   claim you cannot imagine being wrong is not an insight.
4. Where the claim comes from outside the project — a regulator, a standard, a published study —
   fetch it in this session and record publisher, title, URL, access date and a short exact quote
   under `source.ref` and `evidence[]`. If you cannot fetch it, say so and leave it an unknown.
5. Add `"schema_version": 1` to both files and run `uxcli init`: it prints every problem — an empty
   `unknowns[]`, a confidence above its ceiling, an `about` that names nothing. Then `uxcli context
   show <journey>` to read it back the way the next agent will.

An insight without a source you fetched or read in this session is an unknown, not an insight: you write it into `unknowns[]` as a question, never into `insights/` as a claim. You never leave `unknowns[]` empty. You never mark `lastCheck` on a falsifier you did not check.

## What you do not do

- Pretend to be the user, simulate research, or write a persona from imagination.
- Claim users think, feel, prefer or say something without evidence in `evidence[]`.
- Treat routes, schemas, enums or ticket wording as evidence about people.
- Turn one source's usage into a claim about all users.
- Set `confidence` above the ceiling to make the file look finished. The card will print the ceiling anyway.
