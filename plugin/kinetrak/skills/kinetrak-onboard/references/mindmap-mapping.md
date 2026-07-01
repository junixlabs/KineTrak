# Code → board mapping (B1)

How to translate the B0 scan summary into KineTrak board structure. Additive only.

## The mapping

| In the codebase | On the board | Tool |
|---|---|---|
| Workspace package / top-level source area / bounded context | **Module** | `find_or_create_module` |
| A user/product-meaningful capability inside an area | **Feature** under that module | `find_or_create_feature` |
| The project's domain, stack, conventions, constraints | The **`Project Context`** feature in a **`Meta`** module | `find_or_create_*` + `update_feature` |
| Where a feature lives in the repo (path) | One line in the feature's description | `update_feature` (desc) |
| A decision/assumption you made while mapping | A dated note | `append_note` |

## Rules

- **Idempotent.** Always use `find_or_create_*` so re-running onboarding (or onboarding a partially
  mapped board) does not duplicate modules/features.
- **Mirror the code, don't idealize it.** Module boundaries come from the repo's actual structure,
  not the architecture you wish it had. If two areas are tangled in the code, map them as they are
  and note the tangle — restructuring is a later, gated decision.
- **Features are product-meaningful.** Map capabilities a user or stakeholder would recognize, not
  every file or helper.
- **Status reflects reality.** Working/shipped capability → `status: done`. Partial or in-flight →
  `progress`. Never mark something `done` you have not confirmed exists and works.
- **Traceability.** Every feature description names its path(s) in the repo, so a reader can jump
  from board to code.
- **No swimlane yet.** Onboarding maps *structure* (modules/features). Workflow swimlanes belong to
  the decompose step of actual development work, not to the as-is map — unless the human asks for a
  specific existing flow to be diagrammed.

## `Project Context` template

Write the as-is summary into the `Project Context` feature description, e.g.:

```
Domain: <what the product is, who uses it>
Stack: <languages, frameworks, datastore, how it runs>
Modules: <area → repo path>, ...
Conventions: <naming, tests, branch/PR rules; link CLAUDE.md/AGENTS.md if present>
Constraints: <known limits, gotchas, debt>
Data flow: <one or two sentences>
Onboarded: <date>  ·  Baseline snapshot: v0: as-is
```

Future sessions read this first (per `kinetrak-orient`), so keep it accurate and current — append a
session line + the latest cursor on close.
