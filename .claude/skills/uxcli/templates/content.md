# Docs and help centre — the `content` template

Documentation, help centres, knowledge bases and publications: people arrive with a question and leave when it is answered.

A template is where research starts, not what it found. Nothing below is a fact about this product's users: the screens and journeys are what products of this kind usually have, and every question is yours to answer from a source before it becomes an insight. `uxcli template apply content` writes the actor questions into `.uxcli/understanding/actors/`; `references/research.md` in this skill is how to answer them.

## Who uses it

### `question_seeker`

Someone in the middle of a task who hit a problem and came to find the answer.

- Which questions bring people here most often, in the words they type into search?
- Where do they arrive from: a search engine, a link inside the product, an error message, a colleague?
- Do they read the page or scan it for one step, a code sample or a setting name?
- What do they do when the page does not answer them: search again, contact support, give up?
- Which device and which language do they read on?

### `learner`

Someone new to the product working through it in order, from first steps to a working setup.

- What does a first working result look like for them, and how long should it take?
- Which concepts do they need before which tasks?
- Where do they stop and why — a missing prerequisite, an unexplained term, a broken example?

## Screens, and the lens each is read against

| Screen | Lens | What the person does there |
|---|---|---|
| Docs home (`home`) | `content` | Sees what is covered and picks a starting point or searches. |
| Search results (`search-results`) | `content` | Recognises the page that answers the question from its title and excerpt. |
| Article or guide (`article`) | `content` | Finds the answer on the page and acts on it. |
| Reference page (`reference`) | `data` | Looks up one exact value, parameter or setting. |
| Was this helpful (`feedback`) | `transaction` | Says the page did or did not answer the question, in one action. |
| Contact support (`contact`) | `transaction` | Asks for help without retyping what the page already knows. |

## Journeys to walk first

### `search-and-answer` — Find the answer to one question

Actor `question_seeker`, through: `home` → `search-results` → `article`.

Watch when you walk it:

- The answer is visible without scrolling past an introduction at a phone viewport.
- Search results show enough of each page to choose without opening several.
- The article's headings let the person jump to the part they need.

### `get-started` — Reach a first working result

Actor `learner`, through: `home` → `article` → `article` → `reference`.

Watch when you walk it:

- Each guide says what it needs before it starts and what the reader will have at the end.
- Code and values can be copied without retyping.
- The next step is linked from the end of each page.

### `give-up-and-ask` — Get help when the docs did not answer

Actor `question_seeker`, through: `article` → `feedback` → `contact`.

Watch when you walk it:

- The way to ask for help is reachable from the page that failed, not only from the home page.
- The contact form does not ask again for what the page already knows (the page, the product version).
- After sending, the page says when to expect an answer.

## What to research about the domain

- Which search terms bring people to the docs, and which of them return nothing useful?
- Which pages have the most exits to support, and what do those support tickets ask?
- What vocabulary do people use for the product's features, as opposed to the product's own names?
- Which versions of the product do readers run, and do pages say which version they describe?
- What reading level and languages does the audience need?

## Where research starts

- [GOV.UK — content design: writing for GOV.UK](https://www.gov.uk/guidance/content-design/writing-for-gov-uk) — Researched guidance on how people read on screens and how to write so they find the answer.
- [Nielsen Norman Group — 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — Help and documentation is heuristic 10; the baseline vocabulary for any screen.
- [Diátaxis](https://diataxis.fr/) — A documentation framework separating tutorials, how-to guides, reference and explanation by what the reader needs.
- [GitHub Primer](https://primer.style/) — Content and navigation patterns from a documentation-heavy product.
