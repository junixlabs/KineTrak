# KineTrak plugin

Bundles the KineTrak agent workflow into one install: the 8 lifecycle **skills** and the
**MCP server** that exposes your board. Once installed, an agent can onboard a codebase and run
orient → specify → decompose → implement → validate → ship — with the board as its live memory.

## Install

```
/plugin marketplace add junixlabs/KineTrak
/plugin install kinetrak@kinetrak-tools
```

On install you are prompted for your **KineTrak API Key** — mint one on the Connect page at
<https://kinetrak.thejunix.com> (Home → *Connect agent*). It is stored in your OS keychain, never
committed. The `kinetrak` MCP server starts automatically and the skills load as
`/kinetrak:kinetrak-orient`, `/kinetrak:kinetrak-onboard`, etc. (they also auto-trigger by intent).

A key is scoped to one workspace — see the in-app **Agent Guide** for the workspace model and the
full lifecycle.

## What's inside

- `skills/kinetrak-*` — orient, onboard, specify, decompose, implement, validate, ship,
  session-close (+ `_shared/tier-rules.md`).
- `.claude-plugin/plugin.json` — manifest + `userConfig` (API key) + the `kinetrak` MCP server
  (HTTP transport to `https://kinetrak.thejunix.com/mcp`).

The playbook itself (`docs/AGENT_PLAYBOOK.md`) also travels with the MCP server as its `instructions`
and prompts, so the process is available even without the skills.

## API-key injection

The manifest injects the key into the server's `Authorization` header via
`Bearer ${user_config.api_key}`. If a Claude Code version does not interpolate `${user_config.*}`
inside HTTP `headers`, use one of these fallbacks:

1. Set an env var and reference it: `"Authorization": "Bearer ${KINETRAK_API_KEY}"`, then export
   `KINETRAK_API_KEY` before launching Claude Code.
2. Skip the bundled server and add it yourself (the plugin still ships the skills):
   ```
   claude mcp add --transport http kinetrak https://kinetrak.thejunix.com/mcp \
     --header "Authorization: Bearer <KEY>" -s user
   ```

## Note for maintainers

These `skills/` are the **distributable copy**. The canonical source is the repo's
`.claude/skills/kinetrak-*` (used when developing KineTrak itself). Keep them in sync when a skill
changes (or later collapse to one source).
