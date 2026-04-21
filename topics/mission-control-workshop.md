# Mission Control Workshop

## Summary
Workshop is now much closer to the intended execution center of Mission Control: a Celine-first operating surface where column placement follows real task progression, review/blocker handling is explicit, archive replaces lingering done-state clutter, and queue behavior is being aligned with how real agents will claim work once the Mac mini environment is live.

## Decisions
- Workshop replaces Task Board as the product framing.
- Project filtering should disappear from the main Workshop UI for now.
- Clicking a task should open a right-side detail panel rather than a centered modal.
- `Celine Queue` was renamed to `Celine Check`.
- `Claude Code Tasks` and `Hermes Scheduled Tasks` should be removed from Workshop for now.
- `Spawn Sub-Agent` should not remain a primary Workshop CTA.
- Workshop should use a simplified four-column operating model: Queue, In Progress, Blocked, Review.
- Approved work should leave the board to Archive instead of sitting in Done.
- Final review ownership should be explicit per task: either `me` or `chief of staff`.
- Chief-of-Staff-owned approvals should auto-archive and generate a notification for Can.
- Queue cards should stay minimal: no task number, no owner-name duplication, no comment counts, no due/overdue noise, no Dunk control, and no bottom tag row.
- Workshop should not allow arbitrary drag/drop between columns; board position must reflect actual backend task progression.
- Queue order should model real execution behavior per agent: one active in-progress task at a time, then queued tasks ordered by urgency and FIFO.

## Work Completed
- Drafted and maintained a review-ready Workshop spec in `topics/mission-control-workshop-spec.md`.
- Updated Mission Control nav language from `Task Board` to `Workshop` and from `Agent Squad` to `Agents`.
- Reworked Workshop from the inherited Builderz board toward a Celine-first operating surface.
- Added oversight controls including search, All Work / By Agent / Needs Attention / Celine Check views, stronger attention logic, and tighter agent-to-workshop navigation.
- Implemented the Phase 3 execution-loop contract so task metadata now carries agent-generated operational signals such as `latest_update`, `update_type`, `next_action`, and `waiting_on`.
- Added explicit execution controls in the task detail panel for start, blocked, review request, completion, and review decision handling.
- Split execution actions from review decisions, including explicit Accept / Decline semantics in review.
- Routed review declines and blocker escalations through Celine without changing the true assignee.
- Simplified the completed-task surface and added archive handling so archived work can be hidden or revealed intentionally.
- Enforced assignment-required task creation and added a task-level final-review ownership toggle (`human` vs `chief_of_staff`).
- Simplified the main Workshop board to the four operating sections: Queue, In Progress, Blocked, Review.
- Simplified queue cards by removing task number, redundant owner labeling, comment count, overdue, Dunk, and bottom tags while keeping the agent avatar.
- Added queue-position display on queued work using per-agent ordering.
- Removed manual drag/drop between columns so board progression is no longer operator-arbitrary.
- Fixed the review acceptance path by moving approval/archive handling into the quality-review backend path instead of conflicting UI-side transitions.
- Added a migration-readiness polish pass so Workshop computes queue state more like the real system: per-agent active task detection, queue ordering by urgency then FIFO, and column placement derived from actual task progression rather than presentation-only labels.
- Rebuilt successfully after the latest queue/progression/refinement passes.

## Relevant Files
- `projects/celine-mission-control/src/components/panels/task-board-panel.tsx`
- `projects/celine-mission-control/src/components/panels/agent-squad-panel-phase3.tsx`
- `projects/celine-mission-control/src/components/dashboard/sidebar.tsx`
- `projects/celine-mission-control/src/app/api/tasks/[id]/route.ts`
- `projects/celine-mission-control/src/app/api/tasks/[id]/comments/route.ts`
- `projects/celine-mission-control/src/app/api/tasks/queue/route.ts`
- `projects/celine-mission-control/src/app/api/quality-review/route.ts`
- `projects/celine-mission-control/src/lib/task-status.ts`
- `projects/celine-mission-control/src/lib/task-dispatch.ts`
- `projects/celine-mission-control/src/lib/validation.ts`
- `projects/celine-mission-control/messages/en.json`
- `topics/mission-control-workshop-spec.md`

## Open Questions
- Whether blocked or review-state tasks should count as fully available capacity immediately for all future scheduler/dispatch logic, or whether there should be optional per-agent concurrency limits later.
- Whether the backend should eventually expose a first-class computed `workshop_status` / `queue_position` API so the UI no longer computes those client-side.
- Whether the right-side detail panel should eventually become a persistent split view for heavy operating sessions.
- How much session/thread context should surface in the task detail panel without making Workshop noisy.
- When the real Aegis agent exists, which tasks should route to it selectively versus staying in normal human/Chief-of-Staff review.

## Next Steps
1. Move queue/order computation fully into backend APIs so Workshop UI and dispatch/scheduler logic share one authoritative source of truth.
2. Add a lightweight simulation or test fixture pass for multi-agent queue scenarios, especially same-agent urgency preemption and blocked-task release behavior.
3. Finish the real user-facing notification path for Chief-of-Staff approvals if Can wants proactive messaging beyond in-app notifications.
4. Create a real Aegis agent record with a valid `openclawId` once the review-routing policy is ready.
5. Keep local review launch/restart workflow documented and stable so the Mac mini migration can reproduce this operating model quickly.
