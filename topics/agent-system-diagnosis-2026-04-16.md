# Agent System Diagnosis, 2026-04-16

## Summary
The underlying agent system has architectural drift across at least four separate truth surfaces:
1. `~/.openclaw/openclaw.json` configured agents
2. `~/.openclaw/agents/*` on-disk agent state directories
3. live gateway session stores under each agent's `sessions/sessions.json`
4. Mission Control's local SQLite `agents` table and attachment metadata

These surfaces currently disagree. Mission Control work should pause until this disagreement is resolved because it creates ambiguous routing, invisible agents, and unreliable assumptions about what a "registered agent" actually means.

## Confirmed findings

### 1. OpenClaw configured agent list only contains Celine
Evidence:
- `openclaw agents list --json` returns only one configured agent, `main` / `Celine`.
- `openclaw status` reports `Agents: 1` and only one bootstrap file present.
- Current `~/.openclaw/openclaw.json` contains:
  - `agents.list = [{ id: "main", name: "Celine", ... }]`
  - no `mission-control-coding-specialist` entry.

Impact:
- The coding specialist is not a first-class configured agent in the CLI-visible control plane.
- Any logic assuming `openclaw.json` registration alone confirms worker availability is false.

### 2. The coding specialist exists on disk anyway
Evidence:
- `~/.openclaw/agents/mission-control-coding-specialist/` exists.
- It has `agent/models.json`, `agent/auth-state.json`, `agent/auth-profiles.json`, and session logs.

Impact:
- The system permits an agent-like runtime state directory to exist without that agent being present in the configured agent list.
- This is a core architectural inconsistency: disk state and config state can diverge silently.

### 3. The coding specialist has live/previous session state, but the primary listed session is not what Mission Control expects
Evidence:
- OpenClaw `status` shows live sessions for:
  - `agent:main:main`
  - `agent:main:subagent:0cbae282-83f7-4d28-9fdc-97c60971e82f`
- It does **not** currently show a visible active `agent:mission-control-coding-specialist:main` session in `openclaw status`.
- Yet the coding specialist's own session store on disk contains `agent:mission-control-coding-specialist:main` history.
- Mission Control DB currently points the worker at `session_key = agent:main:subagent:0cbae282-83f7-4d28-9fdc-97c60971e82f` and `runtime_type = subagent`.

Impact:
- There is a mismatch between:
  - configured isolated-agent identity (`mission-control-coding-specialist`)
  - existing isolated-agent disk/session state
  - Mission Control's chosen worker attachment (`agent:main:subagent:...`)
- This makes delivery target resolution ambiguous and undermines the reliability of the task-thread relay loop.

### 4. Mission Control maintains its own partially independent agent registry
Evidence:
- Mission Control SQLite DB has rows for:
  - `Celine`
  - hidden seeded agents `Hermes`, `Nefes`
  - `Mission Control Coding Specialist`
- The DB row for `Mission Control Coding Specialist` includes config and an `openclawId`, but this does not guarantee presence in `openclaw agents list`.
- The DB row for Celine has `isDefault: false` in config even though the system-level intended default is Celine.

Impact:
- Mission Control's local registry is not a reliable source of truth for actual OpenClaw registration.
- Settings/UI can report an agent as attached even when the CLI control plane does not recognize that agent as configured.

### 5. Manual config edits are not stable enough as a registration strategy
Evidence:
- We previously repaired `~/.openclaw/openclaw.json` to include both Celine and the coding specialist.
- Current config has regressed back to a single-agent `agents.list` containing only Celine.
- That means something in the wider OpenClaw flow likely rewrote or normalized config after the manual repair.

Impact:
- Direct JSON edits are not a dependable long-term method for agent registration.
- A proper fix must use or align with the supported agent-management/control surfaces, or we will keep losing state.

### 6. Mission Control depends on agent-system assumptions that are stronger than reality
Evidence:
- The final task-thread round trip relied on assumptions like:
  - attached worker implies deliverable worker session
  - worker session key implies stable agent identity
  - OpenClaw agent visibility and Mission Control attachment are equivalent
- Those assumptions are currently false.

Impact:
- Mission Control feature work is currently built on top of a shaky agent substrate.
- Continuing Mission Control before fixing the agent substrate will keep causing false positives, confusing UI state, and routing ambiguity.

## Architectural issues

### Issue A. No single source of truth for agent registration
OpenClaw config, on-disk agent state, live sessions, and Mission Control DB can each represent different agent reality.

### Issue B. Supported registration lifecycle is unclear/incomplete in current operation
The system can accumulate agent state directories and sessions that are not reflected in `openclaw agents list`, which suggests agent lifecycle operations are not being applied consistently.

### Issue C. Session identity and agent identity are conflated
Mission Control sometimes treats a subagent session key as if it were the worker's durable identity. That is unsafe. Session identity is ephemeral; registered agent identity should be durable.

### Issue D. Manual edits are vulnerable to overwrite/regression
If `configure` or another OpenClaw flow rewrites `openclaw.json`, hand-repaired agent entries can disappear.

### Issue E. Mission Control attachment semantics are currently stronger than actual OpenClaw registration guarantees
The UI and DB can say an agent is attached even when the CLI-visible agent system does not consider that agent configured.

## Recommended plan

### Phase 1. Establish agent-system source of truth
1. Decide the canonical registration source for agents.
   - Recommendation: OpenClaw managed agent registration (`openclaw agents ...`) should be the source of truth, not Mission Control DB rows and not manual JSON edits.
2. Define the intended durable agent set:
   - `main` / `Celine` as default coordinator
   - `mission-control-coding-specialist` as a first-class secondary registered agent
3. Document the target model explicitly so future repairs are not ad hoc.

### Phase 2. Rebuild registration cleanly through supported surfaces
1. Remove ambiguity around the coding specialist's registration path.
2. Re-register or reconcile the coding specialist using supported `openclaw agents` commands instead of only filesystem/config edits.
3. Verify success by requiring all of these to agree:
   - `openclaw agents list --json`
   - `openclaw status`
   - `~/.openclaw/openclaw.json`
   - `~/.openclaw/agents/<id>/...`
4. Only after agreement, mark the agent as eligible for Mission Control attachment.

### Phase 3. Separate durable agent identity from ephemeral session identity
1. Update the operating model so Mission Control stores both:
   - durable agent id (`openclawId`)
   - current live session key (optional/runtime)
2. Treat session keys as runtime delivery hints, not identity.
3. Prefer real first-class agent sessions over `agent:main:subagent:...` for durable worker lanes when the design goal is a stable specialist agent.

### Phase 4. Make Mission Control registration-aware
1. Before attaching or dispatching to a worker, validate that the target agent exists in the actual OpenClaw configured agent list.
2. If not, show a hard validation failure instead of pretending attachment is healthy.
3. Surface registration health in the UI: configured, has auth, has live session, attached in Mission Control.

### Phase 5. Resume Mission Control only after the substrate is sound
Only after the agent system is coherent should we return to:
- final task-thread round-trip debugging
- Mission Control governed live-lane validation
- specialist workflow UX polishing

## Immediate recommendation
Do **not** continue Mission Control debugging until we first restore the coding specialist as a true CLI-visible configured agent and make all agent-system surfaces agree.
