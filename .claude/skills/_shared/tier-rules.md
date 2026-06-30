# Human-in-the-loop autonomy tiers (shared)

Sort every KineTrak operation by reversibility and blast radius. Enforce as process, not at
runtime discretion. Full text: `docs/AGENT_PLAYBOOK.md` §6.

| Tier | Stance | Operations |
|---|---|---|
| **1 — Read** | Autonomous, no gate | `get_board`, `get_changes_since`, `list_projects`, `search`, `validate_board`, `next_action`, `log_activity`; a single leaf step status flip |
| **2 — Additive** | Autonomous, but narrate via `log_activity` | `append_note`, `add_swim_node`, `add_swim_edge`, `update_swim_node`, `move_swim_node`, `arrange_swimlane` |
| **3 — New structure** | Proceed, but flag for async review | `add_module`, `add_feature`, `update_module`, `update_feature`, `reorder_modules`, `reorder_features`, routine `create_snapshot` |
| **4 — Irreversible / high blast radius** | **Stop and get synchronous approval first** | `delete_module`, `delete_feature`, `delete_swim_node`, `delete_swim_edge`; **ship** promotion; restructuring >3 modules or >10 features in one pass; create/delete a project |

**Before any Tier-3/4 pause**, state in `log_activity` (or to the human): the action and why;
before → after for key fields; a reversibility flag; the alternative considered; the explicit ask.
Never bypass a gate because you judge it safe — the gate is the human's, not yours.
