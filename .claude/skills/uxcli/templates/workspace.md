# B2B workspace — the `workspace` template

CRMs, admin panels, project and ticket tools, internal back-offices: people who come back every day to work through records.

A template is where research starts, not what it found. Nothing below is a fact about this product's users: the screens and journeys are what products of this kind usually have, and every question is yours to answer from a source before it becomes an insight. `uxcli template apply workspace` writes the actor questions into `.uxcli/understanding/actors/`; `references/research.md` in this skill is how to answer them.

## Who uses it

### `daily_operator`

The person who works through records all day: a sales rep, a support agent, a coordinator.

- Which single task do they repeat most in a day, and how many times?
- How many records do they handle per day, and how many are open at once?
- On which device and where do they do it: a desk, a phone between meetings, a site visit?
- What words do they use for the records and states, as opposed to the words the database uses?
- What do they switch to outside the product to finish a task (phone, email, chat, spreadsheet)?
- What makes them lose their place: an interruption, a page reload, a filter that resets?

### `team_admin`

The person who sets the product up for others: permissions, fields, imports, reports.

- Which settings do they change after the first week, and how often?
- Who do they answer to for what the team sees in reports?
- What happens today when a permission or a field is set wrong, and who notices?

## Screens, and the lens each is read against

| Screen | Lens | What the person does there |
|---|---|---|
| Sign in (`sign-in`) | `transaction` | Gets into their own workspace and lands where they left off. |
| First run (empty) (`first-run`) | `workspace` | Understands what goes here and creates or imports the first record. |
| Record list (`record-list`) | `workspace` | Finds the record they need by searching, filtering or sorting, and opens it. |
| Record detail (`record-detail`) | `workspace` | Reads the record and takes the next action on it without leaving the screen. |
| Create or edit record (`record-form`) | `transaction` | Enters or corrects the record's data once, with errors caught before they save. |
| Overview dashboard (`overview`) | `data` | Sees what needs attention today and goes straight to it. |
| Settings (`settings`) | `workspace` | Changes how the workspace behaves and sees that the change took effect. |

## Journeys to walk first

### `first-value` — Get from sign-up to the first useful record

Actor `daily_operator`, through: `sign-in` → `first-run` → `record-form` → `record-list`.

Watch when you walk it:

- The empty state says what goes here and offers the one action that starts it.
- Count the steps from landing to the first saved record; every step must earn its place.
- After saving, the new record is visible where the person expects it, without a reload.

### `find-and-act` — Find one record and take the next action on it

Actor `daily_operator`, through: `record-list` → `record-detail`.

Watch when you walk it:

- The primary action on the detail screen is reachable without scrolling at a phone viewport.
- Every action shows a change within a second; anything longer shows progress.
- Going back to the list keeps the search, filter and scroll position.

### `triage-today` — See what needs attention today and clear it

Actor `daily_operator`, through: `overview` → `record-detail` → `overview`.

Watch when you walk it:

- Numbers on the overview link to the records behind them.
- After acting on a record, the overview reflects the change when the person returns.
- Nothing on the overview needs a legend the screen does not show.

### `change-a-setting` — Change one setting and confirm it applied

Actor `team_admin`, through: `settings` → `record-list`.

Watch when you walk it:

- The setting says what it changes before it is saved.
- A destructive or team-wide change names its consequence and can be undone or is confirmed.
- The effect is visible on the screen it changes.

## What to research about the domain

- What is the domain's own vocabulary for records, stages and outcomes, and where is it written down?
- Which regulations or audit rules apply to the data (personal data, retention, who may see what)?
- Which competing or adjacent tools do these teams already use, and what do people praise or complain about in their reviews?
- What volume and speed does the work have: records per day, time allowed per record, peak hours?
- What does a mistake cost in this domain: a lost customer, a fine, a re-do?

## Where research starts

- [Nielsen Norman Group — 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — The baseline vocabulary for reviewing any workspace screen.
- [IBM Carbon Design System](https://carbondesignsystem.com/) — Enterprise patterns for data tables, forms, notifications and empty states, documented with usage guidance.
- [GitHub Primer](https://primer.style/) — Patterns from a tool people work in all day: navigation, lists, empty states, saving.
- [GOV.UK Design System — patterns](https://design-system.service.gov.uk/patterns/) — Researched patterns for questions, errors and confirmation, tested with real users.
