# Mission Control Next Build Plan

## Summary
This build plan converts the tightened Mission Control blueprint into the next concrete implementation sequence. The goal is to keep pre-Mac-mini work focused on proving the system: trustworthy execution flow, clear governance, strong supervision, coherent information routing, and one real subordinate-agent pilot. This is not the stage for maximum breadth. It is the stage for making Mission Control operationally real.

## Decisions
- Pre-Mac-mini work should prove the system rather than maximize features.
- Mission Control should continue evolving as a governed operating environment, not just a dashboard.
- The next build work should prioritize logic and supervision support before wider feature expansion.
- The first subordinate agent should be treated as a pilot used to validate the operating model.
- Approval logic can be embedded pragmatically in the next build steps even if a full formal approval matrix is defined later.

## Work Completed
- Tightened the operating blueprint with Can.
- Aligned Mission Control with the repaired OpenClaw agent substrate so durable `openclawId` is treated as canonical agent identity and shared-workspace identity bleed from OpenClaw listing surfaces is treated as advisory rather than authoritative.
- Hardened Mission Control workspace/config enrichment rules so non-main agents no longer inherit shared workspace identity as their effective Mission Control identity when they share Celine’s workspace.
- Hardened operations attachment handling to verify that supervisor/worker attachments map to a currently registered OpenClaw agent before Mission Control treats them as healthy attached lanes.
- Preserved migration-friendliness by grounding attachment metadata in reproducible OpenClaw registration data (`openclawId`, `workspace`, `agentDir`) instead of local-only session assumptions.
- Tightened the roadmap and stored durable decisions in memory.
- Clarified the product's highest-value fast actions: Launch tasks, Redirect, Approve.
- Clarified that research/intelligence should later become its own actionable area.
- Clarified that agent creation/management should live within Mission Control.
- Implemented the Workshop approval-routing semantics pass in `projects/celine-mission-control` so `pending_celine` and `pending_human` now land in **Review** instead of remaining visually **In Progress**.
- Reworked the task detail modal toward a **chat-with-Celine** model with Conversation and Overview tabs, timeline-style task comments, and operator messages stored as relay-ready context for the assigned agent.
- Added approval-state overview copy so tasks waiting on Celine, waiting on Can, or in emergency containment explain their routing more clearly inside the detail panel.
- Added fail-safe operations controls backed by settings for dispatch pause, manual-only mode, and live supervisor/worker detachment.
- Added governed intervention endpoints and UI controls for Launch, Redirect, and Approve.
- Fixed the local standalone review runtime so it reads the real project `.data` store instead of silently booting from `.next/standalone/.data`.
- Fixed the intervention API to accept the camelCase payload shape used by the UI (`assignedTo`, `sessionKey`) in addition to snake_case.
- Validated the repaired review instance live on `http://127.0.0.1:3414/tasks`:
  - `POST /api/operations/control` now returns JSON correctly
  - `POST /api/tasks/11/intervene` now executes real Launch / Redirect / Approve transitions
  - detach supervisor / detach worker works against the attached lane
  - dispatch pause and manual-only correctly block new queue claims while allowing an already-running task to continue
- Verified that the current Mission Control branch still builds successfully after this pass.

## Relevant Context
- Blueprint: `topics/mission-control-operating-blueprint.md`
- Roadmap: `topics/mission-control-roadmap.md`
- Workshop state summary: `topics/mission-control-workshop.md`
- Mission Control repo: `projects/celine-mission-control`

## Open Questions
- Whether the real supervisor/worker attachment should remain runtime-only local DB state or be codified in a reproducible bootstrap path.
- How much of the approval/governance model should be made explicitly visible in the UI in the very next pass.
- Whether the next surface after this pilot proof should be Agents hardening, Intelligence foundation, or deeper approval-routing support.

## Next Steps
1. **Codify live attachment bootstrap**
   - decide whether Mission Control should have a tracked, reproducible way to attach `Celine` and the governed worker to real OpenClaw sessions
   - if yes, implement a safe bootstrap or import path rather than relying on manual local DB edits

2. **Queue and dispatch hardening**
   - add live-path tests for queue behavior that distinguish:
     - continuing an already-running task
     - blocking new claims when dispatch is disabled
     - blocking new claims in manual-only mode
   - make the operator surface explain that nuance clearly

3. **Approval-routing support**
   - continue hardening the internal approval model around the agreed classes:
     - autonomous
     - Celine-approved
     - Can-approved
     - emergency containment
   - ensure high-impact changes can carry rationale, risk, rollback path, and evidence

4. **Agent model hardening**
   - strengthen the Agents area so agent purpose, current work, model/runtime, and approval posture are clearer
   - keep agent creation and management inside Mission Control
   - make real attached session state easier to inspect and safer to change

5. **Next governed pilot pass**
   - move from the first successful dry-run controls validation into a true live task execution loop with the coding specialist
   - verify reporting to Celine, blocker escalation, approval waits, redirection, and completion quality end to end
   - completed one relay-hardening step: task-thread Celine relays now fall back to live gateway session discovery when the worker's `session_key` is missing from Mission Control DB state, reducing dependence on partially local-only attachment mirroring
   - completed one dispatch-grounding step: task dispatch now explicitly prefers the governed worker attachment from operations control (`connected_worker_agent`, `workerAttachment.openclawId`, `workerAttachment.sessionKey`) before falling back to ad hoc agent config/task metadata

6. **Intelligence foundation**
   - do not build the full research area yet, but begin shaping an intelligence-inbox model
   - future items should feel like actionable intelligence memos, not raw feed spam
   - each item should eventually support:
     - topic
     - implications
     - action plan
     - escalation path

7. **Migration readiness**
   - continue documenting architecture and local review flows clearly
   - keep setup assumptions portable to the Mac mini
   - avoid shortcuts that would force future reconstruction
