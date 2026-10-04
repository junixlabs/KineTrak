# Mobile app — the `mobile-app` template

Phone-first apps and mobile web apps: short sessions, one hand, interruptions, unreliable connections.

A template is where research starts, not what it found. Nothing below is a fact about this product's users: the screens and journeys are what products of this kind usually have, and every question is yours to answer from a source before it becomes an insight. `uxcli template apply mobile-app` writes the actor questions into `.uxcli/understanding/actors/`; `references/research.md` in this skill is how to answer them.

## Who uses it

### `on_the_go_user`

Someone using the app in short bursts between other things, often one-handed.

- Which task do they open the app for most, and how long is a typical session?
- Where are they when they use it: walking, commuting, at a counter, at home?
- How reliable is their connection, and what should happen when it drops mid-task?
- Which phone sizes and operating system versions do they use?
- What interrupts them, and what do they expect to find when they come back?

### `new_installer`

Someone who just installed the app and is deciding in the first minute whether to keep it.

- What did they install it for, in their own words?
- What are they willing to give before seeing value: an account, permissions, notifications?
- What makes them uninstall in the first session?

## Screens, and the lens each is read against

| Screen | Lens | What the person does there |
|---|---|---|
| Onboarding (`onboarding`) | `transaction` | Gets to the first useful screen with as little setup as possible. |
| Permission request (`permission`) | `transaction` | Understands why a permission is asked before deciding. |
| Home (`home`) | `workspace` | Starts the task they opened the app for, within thumb reach. |
| List (`list`) | `workspace` | Scans and opens an item; pulls to refresh. |
| Detail (`detail`) | `workspace` | Reads one item and takes its main action. |
| Form (`form`) | `transaction` | Enters data with the right keyboard and without losing it to an interruption. |
| Offline or error state (`offline`) | `workspace` | Knows what happened and what still works without a connection. |

## Journeys to walk first

### `first-minute` — Reach the first useful screen after installing

Actor `new_installer`, through: `onboarding` → `permission` → `home`.

Watch when you walk it:

- Count the steps and fields before the first useful screen; each must earn its place.
- A permission is asked when its feature is first used, with the reason on screen.
- Skipping a permission still leads somewhere useful.

### `main-task` — Do the task the app is opened for

Actor `on_the_go_user`, through: `home` → `list` → `detail`.

Watch when you walk it:

- The primary action on each screen is within thumb reach without scrolling at 390x844.
- Every tap answers within a second; anything longer shows progress.
- Going back returns to the same place in the list.

### `interrupted-entry` — Finish a form after an interruption or a lost connection

Actor `on_the_go_user`, through: `form` → `offline` → `form`.

Watch when you walk it:

- What was typed is still there after the error or the interruption.
- The offline state says what failed and offers to retry.
- Each field brings up the keyboard its answer needs.

## What to research about the domain

- Which task opens the app most often, and how long does it take today?
- What share of sessions start from a notification, a link or the home screen?
- Which platform conventions do users expect here (back gestures, tab bars, share sheets)?
- Which store reviews of this app and its competitors complain about what?
- What data must stay on the device or work offline, and what do privacy rules require for it?

## Where research starts

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) — Platform conventions iOS users expect: navigation, controls, permissions, layout.
- [Material Design 3](https://m3.material.io/) — Platform conventions Android users expect, with component usage guidance.
- [Nielsen Norman Group — 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — The baseline vocabulary for reviewing any screen.
- [WCAG 2.2 — target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — The minimum touch target size and spacing a phone screen must meet.
