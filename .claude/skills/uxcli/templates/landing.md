# Product site — the `landing` template

Marketing sites for a product or service: a visitor decides in minutes whether to sign up, buy or get in touch.

A template is where research starts, not what it found. Nothing below is a fact about this product's users: the screens and journeys are what products of this kind usually have, and every question is yours to answer from a source before it becomes an insight. `uxcli template apply landing` writes the actor questions into `.uxcli/understanding/actors/`; `references/research.md` in this skill is how to answer them.

## Who uses it

### `evaluating_visitor`

Someone who arrived with a problem and is deciding whether this product solves it.

- What problem were they trying to solve when they arrived, in their own words?
- Where did they come from (search, a recommendation, an ad, a comparison article)?
- What do they need to see before they believe it works for someone like them?
- What stops them from signing up today: price, effort, risk, someone else's approval?
- Who else is involved in the decision, and what will that person ask?

### `returning_buyer`

Someone who has seen the site before and comes back to compare plans or to buy.

- What did they come back to check?
- Which plan details decide between two plans for them?
- What would make them contact sales instead of signing up themselves?

## Screens, and the lens each is read against

| Screen | Lens | What the person does there |
|---|---|---|
| Home (`home`) | `marketing` | Understands what this is, who it is for and what to do next. |
| Feature or use-case page (`feature`) | `marketing` | Sees how the product handles their specific case. |
| Pricing (`pricing`) | `marketing` | Works out what it will cost them and which plan fits. |
| Sign up (`sign-up`) | `transaction` | Creates an account with as little as is needed to start. |
| Contact sales (`contact`) | `transaction` | Asks a question and knows when they will hear back. |
| Docs or help (`docs`) | `content` | Checks a detail before committing. |

## Journeys to walk first

### `understand-and-sign-up` — Understand the product and sign up

Actor `evaluating_visitor`, through: `home` → `feature` → `sign-up`.

Watch when you walk it:

- What the product is and who it is for is readable without scrolling at a phone viewport.
- Each view has one primary call to action, and it says what happens when pressed.
- Count the sign-up fields; each must be needed to start.

### `compare-plans` — Choose a plan

Actor `returning_buyer`, through: `home` → `pricing` → `sign-up`.

Watch when you walk it:

- Prices state the period, the currency and whether tax is included.
- The differences between plans can be read without hovering or opening anything.
- The plan chosen on pricing is the plan selected in sign-up.

### `ask-a-question` — Ask sales a question

Actor `returning_buyer`, through: `pricing` → `contact`.

Watch when you walk it:

- The contact form asks only what sales needs to reply.
- After sending, the page says what happens next and when.
- An error keeps the message the visitor typed.

## What to research about the domain

- Which words do people in this market use for the problem, as opposed to the product's own feature names?
- Which competitors do visitors compare against, and how do those sites explain price and value?
- What proof does this market trust: customer logos, numbers, reviews, certifications, a free trial?
- Which regulations apply to sign-up and marketing consent here?
- What questions do sales or support hear most from people who have not bought yet?

## Where research starts

- [Nielsen Norman Group — 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — The baseline vocabulary for reviewing any screen.
- [GOV.UK — content design: writing for GOV.UK](https://www.gov.uk/guidance/content-design/writing-for-gov-uk) — Researched guidance on plain language and how people read on screens.
- [Baymard Institute — research](https://baymard.com/research) — Research on account creation, form length and trust signals before purchase.
- [Deceptive Patterns (Harry Brignull)](https://www.deceptive.design/) — The catalogue of patterns that win a sign-up and lose the customer.
