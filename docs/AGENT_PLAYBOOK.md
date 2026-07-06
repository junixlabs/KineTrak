# KineTrak — Agent Playbook

> The canonical process an AI agent follows when operating a KineTrak board over MCP.
> This file is the **single source of truth**: the MCP server's `instructions` string, the
> per-tool descriptions, and the `.claude/skills/kinetrak-*` skills all restate parts of it —
> when the process changes, change it **here** first, then propagate.
>
> Voice is imperative: every instruction is addressed to the operating agent.

---

## 0. Prime directive

**The board is your memory. Read it before you write to it. The server is authoritative; your
chat history is not.**

Three rules that override everything below when they conflict:

1. **Recall before acting.** Never guess what exists on the board — load or search for it first.
2. **The board is durable; notes are hints.** Before acting on a fact you recalled from a note or
   from your own earlier reasoning, verify it against the live board (`get_board` / `search`).
3. **Gates are hard.** The autonomy tiers in §6 are enforced by process, not negotiated at
   runtime. If an action is Tier 4, you stop and ask — even if you are confident.

---

## 1. Core conventions

KineTrak has no "rules file" the way spec-kit (constitution) or Kiro (steering) do. These
conventions create that slot on the board itself. Honor them on every project.

### 1.1 The `Meta` module + `Project Context` feature

Every board has a module named **`Meta`** containing a feature named **`Project Context`**. Its
description is the project's durable memory — the equivalent of a steering/constitution file:

- **Domain & purpose** — what the product is, who uses it.
- **Tech stack & architecture** — languages, frameworks, key services, where things live.
- **Conventions** — naming, testing approach, branch/PR rules, anything an agent must respect.
- **Recent major decisions** — a short rolling log (full decisions go in ADR notes, §1.2).
- **Resume cursor** — the last `get_changes_since` cursor (see §7.3).

You **read `Project Context` first** in every session and **update it last**. If it does not exist,
create it (`find_or_create_module "Meta"` → `find_or_create_feature "Project Context"`).

### 1.2 Decisions = append-only notes (lightweight ADRs)

When a non-trivial decision is made (architecture, scope, a tradeoff), record it with
`append_note` on the relevant feature or swim step: what was decided, why, and what was rejected.
The swimlane shows *who/where* a decision happened; the note records *what and why*. Keep them
dated and short.

### 1.3 Traceability

Each swimlane step belongs to the feature it implements. State the parent feature in the step's
description or an `append_note` so a reader can trace step → feature → module. Never leave a step
orphaned (`validate_board` flags this).

### 1.4 Identity discipline

Module/feature/step **IDs are durable; names drift.** Resolve IDs fresh via `search` or
`get_board` each session — never hard-code an ID from a previous session or from a note. Use the
`find_or_create_*` tools when re-running a task so you stay idempotent.

### 1.5 Codifiable business rules (when a project has them)

Most projects' logic is **flow** (Swimlane) + **acceptance criteria** — those are covered directly.
Some projects also have **codifiable rules**: invariants, decision tables, state transitions,
eligibility/pricing conditions (e.g. "a refund > $500 needs manager approval", "an order in state X
can't move to Y"). Do **not** ask for a special "rule" object — KineTrak has none by design (a
first-class Rule entity would be dead weight for the many projects that have no such rules). Capture
a codifiable rule with the primitives that already exist:

| Aspect of the rule | Represent it as |
|---|---|
| The rule statement | a `constraint` on the feature/step it governs |
| Where the rule is enforced in code | `link_code` to that file / symbol |
| Verifying the rule holds | an acceptance criterion (`set_acceptance` / `check_acceptance`) |
| The rule drifting from its code | already automatic — `codeStale` → outdated alert (once code-linked) |
| Why the rule changed | a dated `append_note` (lightweight ADR) |
| What a change to the rule affects | `compute_impact` (via crossLinks / `dependsOn`) |
| A cross-system integration contract | an org-board edge: `desc` = the contract, `link_org_edge_code` + feature anchors (§1.7) |

That is a rule's full lifecycle with zero new machinery; projects without rules simply don't use it.
Only if a single project accumulates *so many* rules that constraints become unmanageable should a
dedicated Rule model be reconsidered — until then this convention is the source of truth for rules.

### 1.6 The description contract (write tight; compact, don't accumulate)

A feature/step `desc` is the **current contract**, not a history log. Left unbounded, an agent will
ramble, restate other fields, and keep pasting legacy/backfill narration until the card is noise.
Honor these rules on every write:

- **Rewrite, don't accumulate.** When the truth changes, **rewrite** the contract to the present
  state. Do not keep appending. On every Specify / Validate / Session-close pass, *compact* it.
- **Optimize for a 3-second read.** Contract = a 1–2 line **purpose** (what + why, present tense),
  plus a 1-line **non-goals** only if there is a real boundary risk. That is usually all.
- **Don't duplicate other fields.** Status, acceptance criteria (`validations`), constraints
  (`constraints[]`), code location (`codeRefs`), links (`crossLinks`/`dependsOn`) live in their own
  fields — never restate them in `desc`.
- **No legacy / process narration in the contract.** "previously…", "backfilled…", "migrated
  from…", pasted code, or anything describing what git/the diff/snapshots already record. History
  belongs to git and snapshots, not the spec.
- **History/decisions go below a `— log —` marker**, as terse dated one-liners via `append_note`
  (lightweight ADRs). Keep the **last ~5**; compact older ones into a single line or drop them
  (snapshots hold the full history). The marker keeps the log from diluting the contract.

**Budget (soft, enforced by nudge not truncation):** contract ≤ **~700 chars / ~12 lines**, log ≤
**~5 entries**. Over budget → `validate_board` raises a `bloated_description` warning and the Overview
lists it under "Descriptions to compact". Nothing is cut — you are expected to *rewrite it tighter*.
If the contract can't fit the budget, it is probably **two features** — split it.

### 1.7 Org boards — cross-system truth

When work spans **multiple projects/services**, the workspace's **org boards** (system maps) are
the source of truth for the boundaries: each node is one of the org's projects (or an external
system), each edge is an **integration** whose `desc` carries the contract (endpoints, events,
payloads) and whose `kind` is `api`/`event`/`data`/`other`. The rules:

- **Anchor edges to features.** `fromFeatureId`/`toFeatureId` tie each end of an integration to
  the feature that owns it inside that project. Anchors are what make cross-project impact
  (`compute_org_impact`, consumer-side alerts) and contract drift work — set them whenever you
  know which features own the integration.
- **The edge desc is a contract, not a diagram note.** Same writing contract as §1.6: current
  state, 3-second read, no history. `link_org_edge_code` the implementing files on both sides so
  a VCS webhook flags the edge `codeStale` when they change.
- **Reconciling = touching the contract.** Updating the edge `desc`/`codeRefs` (or
  `resolve_org_edge_stale`) clears the stale flag; renaming a label does not.
- **Alert-only by design.** Cross-project impact never gates shipping — it informs the humans and
  agents on the other side. Treat a stale anchored edge as a **check item** before shipping, not a
  hard stop.
- **Scope test** (what belongs on an org board): if it is tied to a feature/flow ("feature X calls
  service B with contract Y") → board. If it is feature-independent standing architecture (a full
  C4 diagram, message-bus conventions) → keep it outside; at most a truthPointer.

---

## 2. The lifecycle

The spine of all work, expressed in the tools KineTrak exposes:

```
ORIENT → SPECIFY → DECOMPOSE → IMPLEMENT → VALIDATE → SHIP
```

| Step | Goal | Primary tools |
|---|---|---|
| **1. Orient** | Recall current state before touching anything | `get_changes_since`, `get_board`, `search`, `validate_board` |
| **2. Specify** | Write the contract for the work in a feature node | `update_feature`, `append_note` |
| **3. Decompose** | Turn the spec into an ordered plan on the swimlane | `add_swim_node`, `add_swim_edge`, `arrange_swimlane` |
| **4. Implement** | Execute the plan, one step at a time, with evidence | `update_swim_node`, `append_note`, `log_activity` |
| **5. Validate** | Fresh-eyes check against the acceptance criteria | `validate_board`, `search`, `append_note` |
| **6. Ship** | Promote status and checkpoint | `update_feature`, `create_snapshot` |

You may enter the loop mid-stream — **infer the current step from the board** (which features have
specs, which swim steps are done) rather than always starting at step 1. But always run the
**Orient** read path first (§7.1).

### Step detail

**1 · Orient** — see §7.1. End with a one-line `log_activity` stating what you are about to do.

**2 · Specify** — Before writing any code, write the contract into the feature's description:
**goal, non-goals, constraints, acceptance criteria**. Set the feature `status` to reflect intent
(`must` for committed work, `nice` for optional). For an existing project, the spec must state
explicitly **what is out of scope** — "preserve existing structure unless told otherwise."
If the feature touches a system boundary, read the org board first (`get_org_board`,
`compute_org_impact`) — the integration contracts there are constraints on your spec, and a spec
that **changes** a contract needs an `ask_human` gate (it affects other projects' owners).
→ *Human gate: the human reviews the spec before implementation begins.*

**3 · Decompose** — Create an ordered sequence of swim steps for the feature, connected with edges
to show flow. **Every `add_swim_node` must pass `flowId` = the feature id** — this scopes the step
to the feature's flow so the canvas can filter to it and flows never overlap (a step with no flowId
is rejected; see `docs/BOARD_QUALITY.md`). `flowId` is not `link_feature_step`: set both — flowId on
create, `link_feature_step` in the linking pass, pointing at the same feature. Keep it to **~7 steps
per pass**; if it needs more, split into two features. Give each flow a `start` and an `end` step and
let `decision` steps fork. Run `arrange_swimlane` to band the flows and tidy the layout. → *Human
gate: the human reviews the plan.*

**4 · Implement** — Inner loop, one step at a time:
- Do the work (write code, run tests — using your own file/shell tools).
- `update_swim_node` → set that step's status to `done` (or `blocked` if stuck).
- `append_note` with **evidence**: the test that passed, the command run, the file touched.
- `log_activity` to narrate progress for the human watching live.
- Run TDD where possible (failing test first). `create_snapshot` at a meaningful milestone — not
  after every step.

**5 · Validate** — Ideally a **fresh session or subagent** that did not write the code:
- `validate_board` — catch orphans, dangling edges, disconnected steps.
- Re-read the feature's acceptance criteria (written in step 2) and check the work against them.
- `search` to confirm cross-references resolve.
- If the feature is anchored to org-board integrations: `validate_org_board` + confirm the edge
  contracts still describe what you built (update the edge `desc` if the implementation moved).
- `append_note` with the validation result.
→ *Human gate: the human sees the validation note (Activity feed + card).*

**6 · Ship** — Set the feature `status` to `done`. `create_snapshot` with a named, dated label
(e.g. `"v3: checkout flow shipped"`). `log_activity` the shipment. Update the Story Map release
column if the project uses releases. List any **stale anchored integration** as an open check item
in the ship note (alert-only — it informs, it does not block). → *Tier-4 gate (§6): the ship
promotion needs approval.*

---

## 3. Brownfield onboarding (existing project) — the priority path

When pointed at an **existing codebase that is not yet mapped on a board**, do **not** jump into
the lifecycle. The diagram is the *output* of onboarding, not the tool that performs it.

```
B0 Scan  →  B1 Draft map  →  B2 Human gate  →  B3 Develop
```

**B0 · Scan** — Read the repository with your own file tools: directory tree, dependency
manifests, entry points, config, representative source. Produce a compact **as-is summary** —
tech stack, module boundaries as they actually exist, conventions, notable constraints.

**B1 · Draft the map (additive only)** — Write what you found into the board:
- `find_or_create_module` for each real module/area of the codebase.
- `find_or_create_feature` for the significant capabilities inside each.
- Create the `Meta / Project Context` node (§1.1) from the scan summary.
- **Every write here is additive.** You are mapping what exists, not restructuring it.

**B2 · Human gate (mandatory, synchronous)** — Present the as-is map and ask the human to confirm
it matches reality. Fix what they correct. Then baseline it: `create_snapshot("v0: as-is")`. Every
later change is now diffable against this baseline.

**B3 · Develop** — Enter the normal lifecycle (§2). After B2, **restructuring existing modules or
features is a Tier-4 action** (§6) — it requires explicit approval. Default to additive, scoped
changes.

> **Why the ordering is non-negotiable:** reverse-engineering structure wrong and then "fixing" it
> is the fastest way to destroy a human's trust in the board. Map first, confirm, then change.

---

## 4. Greenfield (new project) — for contrast

Lighter and additive by nature:

1. `log_activity("New project — running discovery.")`
2. Discovery interview with the human (domain, users, key modules, first release scope).
3. Populate the Mindmap (`add_module` / `add_feature`) and an initial Story Map release.
4. Write `Meta / Project Context`.
5. `create_snapshot("v0: initial board from discovery")`.

Human gates are lighter (review the initial Mindmap, not every feature). Then run the lifecycle.

---

## 5. State & status model

KineTrak's fields today (do not invent new enum values):

- **Feature `status`**: `must` · `progress` · `done` · `nice` (priority/state hybrid).
- **Swim step `status`**: `todo` · `progress` · `done` · `blocked`.
- **Releases** + the Story Map (journey × release) carry the *roadmap* dimension.

Map the lifecycle onto these fields as follows:

| Lifecycle phase | How to represent it today |
|---|---|
| Planned | Feature exists with a full spec in its description; `status = must` (or `nice`); steps `todo`. |
| In progress | `status = progress`; steps flipping `todo → done`. |
| In review | All of the feature's steps `done`; a validation `append_note` present. (No dedicated status — use the note as the signal.) |
| Released / done | `status = done`; a named snapshot created. |

> A dedicated `planned → in-progress → review → released` vocabulary is a proposed product
> addition (see the playbook design report / `docs/` proposals). Until it lands, use the mapping
> above — it works with the current schema.

---

## 6. Human-in-the-loop autonomy tiers

Sort every operation by reversibility and blast radius. Enforce these as process.

| Tier | Stance | KineTrak operations |
|---|---|---|
| **1 — Read** | Autonomous, no gate | `get_board`, `get_changes_since`, `list_projects`, `search`, `validate_board`, `next_action`, `log_activity`; a single leaf step status flip |
| **2 — Additive** | Autonomous, but narrate via `log_activity` | `append_note`, `add_swim_node`, `add_swim_edge`, `update_swim_node`, `move_swim_node`, `arrange_swimlane`; org-board edge upkeep (`update_org_board_edge` contract/anchors, `link_org_edge_code`, `resolve_org_edge_stale`) |
| **3 — New structure** | Proceed, but flag for async review | `add_module`, `add_feature`, `update_module`, `update_feature`, `reorder_modules`, `reorder_features`, routine `create_snapshot`; `create_org_board`, `add_org_board_node`, `add_org_board_edge` |
| **4 — Irreversible / high blast radius** | **Stop and get synchronous approval first** | `delete_module`, `delete_feature`, `delete_swim_node`, `delete_swim_edge`; `delete_org_board`, `delete_org_board_node`, `delete_org_board_edge`; **ship** promotion; restructuring that touches **>3 modules or >10 features** in one pass; creating or deleting a project |

**Before any Tier-3/4 pause**, your `log_activity` (or message to the human) must state:

- the action and **why**,
- **before → after** for the key fields,
- a **reversibility flag** ("deletes module X and its 5 features — only recoverable via snapshot"),
- the **alternative considered** ("could archive as a disabled module instead"),
- the explicit ask ("Proceed?").

Never bypass a gate because you judge it safe. The gate is the human's, not yours.

---

## 7. Session lifecycle & recall

### 7.1 Orient (run first, every session)

1. `get_changes_since(cursor)` if you have a stored cursor — **incremental recall**, not a full
   reload. (Cursor is an opaque bigserial id; pass back what you last stored.)
2. If no cursor, or it returns nothing useful: `get_board(projectId)` once — full cold-start load.
3. Read the `Meta / Project Context` node.
4. `search(area)` for the specific area you are about to touch.
5. `validate_board()` to surface structural problems before you build on top of them.
6. If the work may span services: `list_org_boards` → `get_org_board` for the boundaries, and
   `validate_org_board` if you will rely on its anchors.
7. `log_activity("Starting: <task>. Board state: <one-line summary>.")`

> Shortcut: `next_action(projectId)` returns the latest cursor plus a recommended next step in one
> call — useful to start step 1, though still read the board/Context for full context.

### 7.2 During a session

- Keep the cursor in working memory; pass it on each `get_changes_since` poll.
- Narrate Tier-2+ actions with `log_activity` so the watching human can follow.
- `create_snapshot` at milestones, **before** any wide or destructive batch (your undo point).

### 7.3 Session close (run last)

1. `append_note` on `Project Context`: `"Session <date>: completed <X>. Next: <Y>. Cursor: <value>."`
2. `create_snapshot` if significant work was done.
3. `log_activity("Session complete. Next session: <plan>.")`

Writing the cursor + next-step back to the board is the only persistent handoff the next session
needs to resume incrementally.

---

## 8. Memory & anti-rot rules

- **Incremental over full.** Prefer `get_changes_since` to re-reading the whole board.
- **Search before you write.** Use `search` / `find_or_create_*` so you never duplicate an
  existing module/feature.
- **Verify recalled facts.** A note that was true last month may be stale — confirm against the
  live board before acting on it.
- **Don't cache IDs across versions.** Resolve fresh (§1.4).
- **Validate after batches.** Run `validate_board` after a cluster of writes; fix `error`-severity
  issues before continuing.

---

## 9. Quick reference

**Always-first read path:** `get_changes_since` → (cold) `get_board` → `Project Context` →
`validate_board` → `log_activity`.

**Per-feature loop:** spec into `update_feature` → swim steps via `add_swim_node`/`add_swim_edge`
→ implement + `update_swim_node`/`append_note` → `validate_board` + validation note →
`status = done` + `create_snapshot`.

**Brownfield:** scan code → draft map (additive) → **human confirms** → snapshot `v0: as-is` →
develop (additive/scoped; restructuring is Tier 4).

**Cross-system:** feature touches a boundary → `get_org_board` + `compute_org_impact` in Specify →
anchor edges (`fromFeatureId`/`toFeatureId`) + `link_org_edge_code` in Decompose/Implement →
`validate_org_board` + reconcile contracts in Validate. Changing a contract = `ask_human` first.

**Stop and ask (Tier 4):** any `delete_*`, ship promotion, wide restructuring, project
create/delete.

**Session close:** note (summary + next + cursor) on `Project Context` → snapshot → `log_activity`.
