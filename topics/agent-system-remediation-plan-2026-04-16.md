# Agent System Remediation Plan, 2026-04-16

## Goal
Fix the underlying agent system before returning to Mission Control, so configured agents, on-disk state, live sessions, and Mission Control attachments all agree and stay durable.

## Canonical intended agent set

### 1. Celine
- Durable OpenClaw agent id: `main`
- Display name: `Celine`
- Role: default coordinator / chief of staff
- Workspace: `/Users/jonozgel/.openclaw/workspace`
- Must always appear in:
  - `openclaw agents list --json`
  - `openclaw status`
  - `~/.openclaw/openclaw.json`
  - `~/.openclaw/agents/main/...`

### 2. Mission Control Coding Specialist
- Durable OpenClaw agent id: `mission-control-coding-specialist`
- Display name: `Mission Control Coding Specialist`
- Role: implementation-focused worker for Mission Control
- Workspace: `/Users/jonozgel/.openclaw/workspace`
- Must always appear in:
  - `openclaw agents list --json`
  - `openclaw status`
  - `~/.openclaw/openclaw.json`
  - `~/.openclaw/agents/mission-control-coding-specialist/...`

## Confirmed remediation progress
- Re-registered the coding specialist using the supported surface:
  - `openclaw agents add "Mission Control Coding Specialist" --workspace /Users/jonozgel/.openclaw/workspace --model openai-codex/gpt-5.4 --non-interactive --json`
- Result: the coding specialist now appears in normal `openclaw agents list --json` and `openclaw status`.
- Corrected specialist identity via supported surface:
  - `openclaw agents set-identity --agent mission-control-coding-specialist --name "Mission Control Coding Specialist" --emoji "🛠️" --theme "coding-specialist" --json`
- Reconciled Mission Control DB worker attachment from the old subagent session to the durable registered agent session:
  - `agent:mission-control-coding-specialist:main`
- Normalized Mission Control DB config so:
  - `Celine` is marked `isDefault: true` and `governedRole: supervisor`
  - `Mission Control Coding Specialist` carries `openclawId: mission-control-coding-specialist`, worker identity metadata, and `runtime_type: agent`
- Important remaining identity issue: `openclaw agents list --json` still displays the worker with inherited `identityName: "Celine"` / `identityEmoji: "🗂️"` even though `openclaw.json` now stores the correct specialist identity. This indicates another underlying identity-resolution bug in the agent system itself.

## Remaining issues to solve before Mission Control resumes

### Issue 1. OpenClaw identity resolution still appears muddled for non-main agents
Even after setting specialist identity explicitly in `openclaw.json`, `openclaw agents list --json` still shows the worker with inherited `identityName: "Celine"` and `identityEmoji: "🗂️"`.

**Diagnosis**
This is not a registration failure. OpenClaw’s agent summary builder loads identity by calling `loadAgentIdentity(workspace)`, and both agents currently resolve to the same workspace path:
- `/Users/jonozgel/.openclaw/workspace`

That workspace contains `IDENTITY.md` for Celine, so the list surface prefers shared-workspace identity over per-agent config identity. The result is that non-main agents with the same workspace inherit Celine’s visible identity in `openclaw agents list --json`.

**Why this matters**
The supported CLI listing surface is not faithfully reflecting per-agent identity when multiple agents share one workspace. This is primarily a shared-workspace identity precedence issue.

**Fix**
Do not treat `openclaw agents list --json` identity fields as canonical when multiple agents share one workspace. For Mission Control add-agent logic, use durable agent id plus stored config identity, and treat workspace-derived identity as advisory unless agent workspaces are isolated.

### Issue 2. Registration health is not surfaced strongly enough in Mission Control
Mission Control can currently treat a worker as attached even when agent-system health is partial or ambiguous.

**Fix**
Add explicit preflight checks before attach/dispatch:
- agent exists in `openclaw agents list`
- agent has state directory
- agent has auth/model files
- live session exists if required for the current action

## Execution plan

### Phase A. Finish agent-system cleanup
1. Re-check `openclaw agents list --json` after identity update.
2. Re-check `openclaw status` and confirm the specialist remains visible.
3. Confirm `~/.openclaw/openclaw.json` still contains both agents after identity changes.
4. Confirm specialist identity output is no longer inherited from Celine.

### Phase B. Reconcile Mission Control to the durable agent system
1. Update Mission Control worker attachment to target the durable registered specialist session path, not the old `agent:main:subagent:...` path. ✅
2. Normalize Celine default/coordinator semantics in Mission Control DB/config. ✅
3. Add registration-aware validation to the Mission Control attachment path.

### Phase C. Fix remaining agent-system identity inconsistency
1. Diagnose why `openclaw agents list --json` still reports inherited Celine identity fields for the specialist. ✅
2. Determine whether this is a listing-layer/shared-workspace precedence issue or deeper metadata corruption. ✅
3. Re-run full consistency checks across config, CLI listing, status, disk state, and Mission Control DB. ✅

### Phase D. Only then resume Mission Control debugging
1. Re-run the live task-thread relay on top of the corrected durable worker identity.
2. Verify end-to-end:
   - task message
   - Celine reply
   - worker execution
   - worker response written back into task thread
3. Resume Mission Control add-agent work only after this full path is proven.

## Lessons to remember for add-agent work
- Do not rely on manual `openclaw.json` edits as the primary registration method.
- Do not treat on-disk agent state as proof of configured registration.
- Do not treat a subagent session key as a durable worker identity.
- Require agreement across config, CLI listing, disk state, live status, and Mission Control DB before calling an agent “healthy”.
- Build the Mission Control add-agent function around supported OpenClaw registration surfaces first, then local app metadata second.
- When multiple agents share one workspace, do not assume `openclaw agents list --json` identity fields represent per-agent truth; the CLI can inherit identity from the shared workspace `IDENTITY.md`.
- For durable Mission Control agent records, prefer canonical fields in this order:
  1. durable `openclawId`
  2. configured OpenClaw agent `name`
  3. stored per-agent config identity
  4. runtime session key
  5. workspace-derived identity only as a fallback/advisory surface
