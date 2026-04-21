# OpenClaw Agent Architecture Recovery

## Summary
Audit and recovery plan for a foundational OpenClaw architecture issue where the intended primary assistant identity (Celine) collapsed into a single specialist agent configuration (`mission-control-coding-specialist`) that became the default brain and WhatsApp entrypoint.

## Current Broken State
- `~/.openclaw/openclaw.json` currently defines only one agent in `agents.list`:
  - `mission-control-coding-specialist`
- That agent is effectively the default routed agent for WhatsApp.
- The shared workspace is still `/Users/jonozgel/.openclaw/workspace`, which contains Celine's persona/bootstrap files.
- The specialist agent therefore inherited the main persona files by workspace reuse.
- There is no distinct configured `main` agent entry preserving Celine as a separate persistent identity.
- Agent-local state under `~/.openclaw/agents/mission-control-coding-specialist/agent/` contains auth/models but no separate workspace-level persona files.
- Result: model/config changes that should have affected the main assistant instead affected the specialist, and user-facing routing now lands on the specialist.

## Root Cause
We conflated three separate concepts:
1. main assistant identity
2. delegated specialist execution
3. persistent multi-agent routing

Instead of keeping Celine as the stable default agent and using sub-agents or a separately routed worker only when explicitly intended, the specialist was configured as the only persistent agent while still pointing at Celine's workspace. That created identity/config/routing bleed.

## Relevant OpenClaw Documentation Findings
- Multi-agent docs explicitly define an agent as its own workspace, `agentDir`, auth profiles, and sessions.
- Docs explicitly warn not to reuse `agentDir` across agents because it causes auth/session collisions.
- Each agent should ideally have its own workspace when distinct persona/config separation matters.
- Routing falls back to the default agent when bindings are absent.
- In single-agent mode, the implicit default is `main`.
- `openclaw agents add` cannot create an agent named `main`; `main` is the reserved built-in default identity.

## Recovery Goals
1. Restore Celine as the real primary/default agent for WhatsApp and day-to-day chat.
2. Remove the specialist as the default routed persona.
3. Preserve current evidence and reversibility with config backups.
4. Reintroduce Mission Control specialist only after explicit isolation boundaries are decided.
5. Make the setup migration-safe for the future Mac mini.

## Recommended Target Structure
### Immediate safe state
- Operate with only one persistent agent again: `main` / Celine.
- Keep the current workspace as Celine's workspace.
- Remove `mission-control-coding-specialist` from `agents.list` once recovery is confirmed.
- Use sub-agents or ACP sessions for bounded specialist work, not persistent replacement of the main brain.

### Future multi-agent state (only if/when reintroduced)
- `main` (Celine)
  - workspace: `~/.openclaw/workspace`
  - receives WhatsApp default traffic
  - stable identity and memory
- `mission-control` or `mission-control-coding`
  - separate workspace such as `~/.openclaw/workspace-mission-control`
  - separate `agentDir`
  - no default inbound routing unless explicitly bound
  - invoked intentionally for specialized work

## Proposed Repair Sequence
1. Back up `~/.openclaw/openclaw.json`.
2. Write a corrected config where:
   - Celine/main is restored as the default effective agent
   - the specialist is removed from default traffic
3. Restart gateway.
4. Validate:
   - `openclaw agents list --bindings`
   - `openclaw status --all`
   - WhatsApp still routes correctly
   - model changes now target the main/default agent rather than the specialist-only record
5. If clean, optionally delete the specialist with `openclaw agents delete mission-control-coding-specialist --force`.
6. Later, if needed, recreate a specialist via `openclaw agents add ...` with a separate workspace.

## Risks / Checks
- Need to verify how OpenClaw behaves when `agents.list` is absent or empty versus explicitly including a `main` agent entry.
- Need to avoid accidental loss of auth/session records before confirming recovery.
- Need to test whether deleting the specialist would move its session store to Trash as documented.
- Need to keep all irreversible cleanup until after a confirmed stable main-agent recovery.

## Next Steps
1. Inspect whether OpenClaw supports an explicit `main` entry in config or prefers implicit single-agent mode.
2. Apply the smallest safe config repair that re-establishes Celine as the default.
3. Restart and run routing/model validation.
4. Only then decide whether to delete the specialist immediately or keep it detached pending clean reintroduction.
