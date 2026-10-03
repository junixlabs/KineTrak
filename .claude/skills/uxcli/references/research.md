# research — learning the domain before you design for it

Read when: you are about to design for a product whose field you do not already know from sources —
its vocabulary, its rules, what its people do all day and what goes wrong for them. A screen designed
from what a model assumes about a field looks plausible and fails the person who works in it. This is
how you find out first, and how you write down what you found so the next agent does not have to.

## Start from the kind of product

```bash
npx -y @junixlabs/uxcli template                 # workspace, shop, landing
npx -y @junixlabs/uxcli template show <id>       # screens and their lens, journeys to walk, what to research
npx -y @junixlabs/uxcli template apply <id>      # the actor questions, written as unknowns (creates only)
```

A template is where research starts, not what it found: every line about people in it is a question.
If no template fits, take the closest one's questions as a checklist and say which you skipped.

## Where to look, in order of how much it can carry

| Rank | Source | What it can tell you | `evidence` when it becomes a viewpoint or an insight |
|---|---|---|---|
| 1 | The project's own data: analytics, support tickets, interview notes, sales calls, the running product | What these people actually do and where they get stuck | insight `source.type` = analytics, interview, ticket, run |
| 2 | Regulations and standards for the field: laws, WCAG, industry rules | What must be true whatever anyone prefers | `author`, with the clause quoted |
| 3 | Published research with a method: Baymard, NN/g studies, peer-reviewed HCI | What holds across many products of this kind, and how strongly | `study` |
| 4 | Public design systems and style guides: GOV.UK, Carbon, Primer, Polaris, USWDS | Patterns that were tested and are maintained, with usage rules | `author` |
| 5 | Products people in the field already use, and their reviews | The conventions they expect and the complaints they repeat | `secondary`, the review quoted |
| 6 | Community practice: articles, talks, threads | Ideas worth testing | `folklore` — never more than a hypothesis |

The lenses (`lenses/<kind>.md`) and the topic pools behind them are rank 3 and 4, already fetched and
quoted. Read them for the kind of screen; research is for what they cannot know — this field.

## What to come back with

1. **The field's words.** The terms people in the field use for its records, states and outcomes, each
   with where you saw it. Labels, headings and messages use these words, not the database's.
2. **The rules.** What a regulation or standard requires of this kind of screen (consent, retention,
   disclosure, accessibility), quoted with its clause.
3. **The work.** Which task is repeated most, how often, under what pressure, on which device — from
   rank 1 sources if the project has them; otherwise it stays an unknown.
4. **The conventions.** How two or three products the people already use handle the same task, and what
   their reviews complain about. A convention people already know is a reason, not a rule.
5. **The open questions.** Everything you could not settle, as questions in the actor's `unknowns[]`.

## How to write it down

- A finding about people or about this field is an insight (`references/understand.md`): one claim,
  its `source`, the exact numbers or words in `evidence[]`, and what would prove it wrong.
- A finding about how screens of this kind should work is a candidate viewpoint: who said it, where,
  their words. Bring it to the person running you; uxcli's pools only carry what someone can cite.
- Fetch what you cite in this session and quote it exactly. A page you could not open is not a source:
  say so and leave the question open.
- Then design: `uxcli context show <journey>`, the lens for each screen the template names, and the
  mockups (`references/mockups.md`).

## What you do not do

- Fill an unknown from what you expect the field to be like. An unanswered question stays a question.
- Treat a competitor's screen as evidence that its pattern works. It is evidence that it exists.
- Raise community advice above a hypothesis because several people repeat it.
- Quote from memory. If the words are not in something you fetched, they are not a quote.
