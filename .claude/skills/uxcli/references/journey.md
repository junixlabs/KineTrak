# journey — writing what the screen must be able to hold

Read when: `context show` says there is no journey, or a flow changed shape. A journey is the file
`uxcli run` measures against; it is authored, and the runtime never edits it.

## What a journey is

One goal that matters to the actor (`goal`), the actor it is for (`actor`, an actor file under
`understanding/actors/`), the insight that says why it exists (`trace[]` → `understanding/insights/`),
the **states** the product must be able to hold, and the **workflows** — concrete paths through those
states. Shape: `examples/crm/.uxcli/journeys/handle-inbound-lead.json`. Take the shape, not the facts.

A state is a predicate: a list of `signals[]`, each one thing an observer can check —

```
{ "observer": "url",     "path": "/leads/{leadId}" }                 | { "observer": "url", "matches": "/workspace/*" }
{ "observer": "dom",     "selector": "[data-uxcli=lead-phone]", "visible": true }
{ "observer": "dom",     "selector": "[data-uxcli=call-action]", "inViewportWithoutScroll": true }
{ "observer": "text",    "selector": "[role=alert]", "contains": "wrong" }
{ "observer": "text",    "selector": "[data-uxcli=lead-phone]", "equalsField": "response.phone", "normalize": "e164" }
{ "observer": "network", "request": "GET /api/me", "status": 200 }
{ "observer": "a11y",    "role": "alert", "visible": true }
{ "observer": "storage", "key": "session.token", "present": true }
```

— plus `mustNotMatch[]`: where the state must be false. Strength is derived from the signals
(`strong` needs a url signal and one of network, storage or a `[data-uxcli=…]` dom signal); you may
lower it, never raise it. A `{param}` in a path or selector is filled from what an earlier step
`produces`.

A workflow is `id`, `kind: happy | recovery`, and `steps[]`: `before` (a state), `action` (words),
`interactions[]` (`ui` with a `target` selector, `navigation`, `api` with `request` and `produces`,
`data`, `system`), `after` (a state), `next`. A fixture step (`kind: fixture`, `profile`) produces the
ids later steps consume. A `before` that no earlier step produces is a prerequisite: reached, not measured.

## How to work

1. Read the actor and the insights the screen leans on (`uxcli context show`). A journey with no
   `trace[]` has no reason to exist; if no insight says why, write that as a question, not a trace.
2. Walk the product or its source and name the hooks: every state needs at least one selector that
   exists on the page, preferably `[data-uxcli=<name>]`. A hook you cannot find is a hook you propose
   to the project (`proposals/`, kind `instrumentation`), not one you write into a signal.
3. Write every state so it can be false somewhere: `mustNotMatch` names where. A state that would
   hold on every page discriminates nothing and the parser says so.
4. Write one happy workflow, and recovery workflows only for failures the product actually has a path
   for. `requires.identityProfile` / `requires.dataProfiles` name what the run must provision; do not
   assume the data exists.
5. Add `"schema_version": 2` and run `uxcli init`: it parses the file and prints every problem
   (a signal naming an observer nobody has, a `{param}` filled from nothing, a strength claimed above
   what the signals give). Fix the declaration, not the product, until it parses clean.
6. Run it: `uxcli run .uxcli/journeys/<id>.json`. The first run at reach `observe` provisions nothing
   and mutates nothing; a `blocked` result says what the policy must grant.

You never invent a state: every signal names an observer uxcli has and a hook you saw on the page or in the source. A state that would hold everywhere discriminates nothing; `mustNotMatch` says where it is false. If the owner is not available to say which state a step must reach, you write the question into the step's `note` and stop; you do not guess a state so the file parses.

## What you do not do

- Edit a journey so that a failing run passes. Change it because the declaration was wrong, and say so in a `note`.
- Write a selector for something not rendered (`type=hidden`, visually hidden).
- Raise a state's `strength` above what its signals give.
- Submit a real form while writing the file. Reading the page is enough.
