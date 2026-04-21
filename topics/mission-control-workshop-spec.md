# Mission Control Workshop Review Spec

## Status
Draft for alignment before implementation.

## Product Intent
Workshop is the execution center of Mission Control.

It should be the single place where Celine and the operator can:
- see all active work across agents
- understand ownership, state, and blockers at a glance
- triage, assign, move, and review tasks
- identify stale or blocked work quickly
- jump from agent context into concrete execution detail

Workshop should feel like an operational control surface, not a generic project board.

## Product Role Within Mission Control
Workshop answers:
- what work exists
- who owns it
- where it stands
- what is blocked
- what needs attention next

Agents answers:
- who each agent is
- what each agent is for
- what each agent is currently doing
- how each agent is configured

This boundary is important.
Workshop owns task flow and execution detail.
Agents owns identity, purpose, and agent-level status.

## Explicit Alignment Decisions
These are already considered decided unless you want to reopen them.

- Workshop is the main detailed task board for the system.
- Agent-specific queue logic should not live in separate top-level tabs.
- Tasks should be labeled and filterable by assigned agent instead of splitting work into per-agent boards.
- Workshop should support strong Celine-first oversight rather than autonomous self-healing behavior.
- The interface should stay opinionated and full-featured, not split into simple and advanced modes.
- Existing read-only sections for `Claude Code Tasks` and `Hermes Scheduled Tasks` should be removed from Workshop for now.

## Current Problems To Correct
The current Task Board still reflects too much of the inherited Builderz shape.

Current issues:
- terminology still says `Task Board` instead of `Workshop`
- status model is more complex than needed for the current product direction
- top controls are still oriented around generic projects and sub-agent spawning
- board columns do not yet match the agreed execution flow
- `Claude Code Tasks` and `Hermes Scheduled Tasks` sections add clutter and are out of scope for now
- the page does not yet clearly emphasize Celine oversight, blockers, and ownership-driven execution

## Workshop v1 Purpose
Workshop v1 should deliver a clean, reliable task operating layer that makes it easy to:
- capture work
- assign ownership
- move work through a small number of clear stages
- review blocked or stale work
- jump in from Agents and understand the state immediately

Workshop v1 does not need to solve every future automation problem.
It needs to become the right center of gravity for execution.

## Proposed IA and Page Structure
Workshop should use a three-part structure.

### 1. Top Control Bar
Purpose: fast filtering, triage, and creation.

Controls:
- search
- assigned agent filter
- status filter
- priority filter
- optional task type filter
- quick saved views / presets
- create task button

Recommended presets:
- All Work
- By Agent
- Needs Attention
- Celine Queue

Controls to remove from this page for now:
- `Spawn Sub-Agent`
- inherited project-heavy controls that do not support the Workshop-first model

Note on projects:
Project support can remain in the data model, but it should not dominate the Workshop UI.
If retained in v1, project filtering should be secondary, not a primary organizing idea.

### 2. Main Work Surface
Default mode should be a kanban board.

Recommended v1 columns:
- Inbox
- Ready
- In Progress
- Blocked
- Review
- Done

Why this set:
- Inbox captures new or untriaged work
- Ready means the task is clearly defined and available to be picked up or assigned
- In Progress shows active execution
- Blocked makes operational attention obvious
- Review gives a clear human or Celine checkpoint
- Done closes the loop cleanly

Columns to remove from the current board model in the primary Workshop experience:
- Backlog
- Assigned
- Awaiting Owner
- Quality Review
- Failed

Important note:
Some of those states may still exist internally or be mapped during migration, but they should not remain as first-class primary columns in the Workshop v1 interface.

### 3. Task Detail Surface
Selecting a task should open a right-side detail panel if technically feasible.
If that is too expensive in the immediate pass, a modal is acceptable as an intermediate step, but the right-side panel remains the preferred target.

Task detail should include:
- title
- description / brief
- assigned agent
- status
- priority
- tags
- due timing if relevant
- source
- latest updates
- blockers / dependencies
- linked thread or session context when available
- activity history
- comments
- quick actions

Preferred quick actions:
- reassign
- change status
- edit task
- add comment / update
- open related agent
- open related session or chat context when available

## Task Model Requirements
Every Workshop task should visibly support the following fields, whether all are shown on the card or only in detail.

Core fields:
- title
- owner agent
- status
- priority
- task type
- latest update
- blocker state
- created at / updated at

Secondary fields:
- due date
- tags
- source
- related session / conversation
- dependency links
- project reference, if used

Task types should stay lightweight in v1.
Suggested initial set:
- build
- research
- review
- bug
- ops
- follow-up

## Card Anatomy
Cards should optimize for fast scanning.

Recommended contents:
- title
- owner agent name or avatar
- priority cue
- one-line latest update or blocker summary
- small secondary tags only when useful

Visual priority should be:
1. title
2. owner and status
3. blocker or update signal

Cards should make these conditions obvious:
- blocked
- stale
- overdue
- unassigned

## Agent Integration Rules
Workshop must integrate tightly with Agents without duplicating the Agents page.

Required behavior:
- agent ownership must be visible on every task card
- Workshop must support filtering by agent
- Agents page should link into prefiltered Workshop views
- Workshop should allow grouped understanding of what each agent owns without creating separate per-agent workspaces

Explicit non-goal:
- no separate board tab or sub-workspace per agent

## Celine-First Oversight Rules
This is where Workshop becomes product-specific rather than generic.

Workshop should elevate:
- blocked work
- stale work
- overdue work
- unassigned work
- tasks awaiting Celine review or clarification
- uneven agent load when visually practical

Recommended Celine-specific views:
- Needs Attention
- Celine Queue

Definition ideas:

### Needs Attention
Tasks that are:
- blocked
- stale beyond threshold
- overdue
- unassigned
- sitting in review too long

### Celine Queue
Tasks that require chief-of-staff intervention, such as:
- clarification
- reassignment
- review
- escalation
- human decision framing

## View Model
Workshop should support a small number of opinionated views rather than many custom layouts.

Recommended v1 views:
- All Work
- By Agent
- Needs Attention
- Celine Queue

Avoid in v1:
- highly customizable saved dashboards
- many alternate board layouts
- separate system-specific sections embedded below the board

## Scope Removals For This Pass
The following items should be removed from the Workshop page for now:
- Claude Code Tasks section
- Hermes Scheduled Tasks section
- Spawn Sub-Agent primary CTA on the board page

The following labels should be renamed for product alignment:
- `Task Board` -> `Workshop`
- `Agent Squad` -> likely `Agents` if not already changed everywhere

## Migration Notes From Current Board
Current board status model:
- backlog
- inbox
- assigned
- awaiting_owner
- in_progress
- review
- quality_review
- done
- failed

Target Workshop v1 board model:
- inbox
- ready
- in_progress
- blocked
- review
- done

Recommended mapping approach:
- backlog -> inbox or ready depending on current semantics; default to inbox if ambiguous
- assigned -> ready
- awaiting_owner -> blocked
- quality_review -> review
- failed -> blocked initially, unless a later explicit failure treatment is designed

This keeps migration simple and avoids over-modeling.

## Phased Delivery Plan

### Phase 1: Structural Reshape
Goal: make the Workshop page match the agreed product model.

Deliverables:
- rename Task Board to Workshop in nav and page language
- remove Claude Code Tasks section
- remove Hermes Scheduled Tasks section
- remove Spawn Sub-Agent CTA from Workshop
- reshape top controls around search, agent, status, priority, and create task
- replace current board columns with the v1 six-column model
- simplify card presentation around owner, priority, and latest update or blocker

Acceptance bar:
- page reads as Workshop, not inherited Builderz Task Board
- board stages match the agreed execution flow
- obvious clutter and off-scope sections are gone

### Phase 2: Oversight and Flow Quality
Goal: make Workshop useful for orchestration, not just storage.

Deliverables:
- add Needs Attention preset/view
- add Celine Queue preset/view
- strengthen stale, blocked, overdue, and unassigned visibility
- improve agent filtering and grouping logic
- strengthen jumps from Agents into filtered Workshop context

Acceptance bar:
- Celine can quickly identify what needs intervention
- agent ownership and bottlenecks are easy to understand at a glance

### Phase 3: Live Execution Loop
Goal: make Workshop the real execution layer for agents and Celine, not just a board.

Deliverables:
- define a clear task state/update contract for operator and agent actions
- implement agent-native task updates (start, progress, blocked, request review, complete)
- upgrade the task detail panel into the primary operating surface
- reflect latest activity, blocker state, and next action automatically in Workshop
- keep the system opinionated and avoid broad automation sprawl

Acceptance bar:
- a task behaves like a live execution object with ownership, updates, blocker reason, and next action, not just a static card on a board

## Phase 3 State and Update Contract

### Core operating states
The Workshop UI continues to center on these six states:
- Inbox
- Ready
- In Progress
- Blocked
- Review
- Done

### Internal-to-Workshop mapping
Internal task states may still exist, but must map cleanly into Workshop:
- `inbox` -> Inbox
- `assigned` -> Ready
- `in_progress` -> In Progress
- `awaiting_owner` -> Blocked
- `failed` -> Blocked
- `review` / `quality_review` -> Review
- `done` -> Done

### Allowed Phase 3 action model
Operator/Celine actions:
- create task
- assign or reassign task
- move task between Workshop states
- edit brief, priority, due date, and tags
- resolve or reframe blocked work
- approve/reject review-ready work

Agent actions:
- start assigned work
- post progress update
- mark blocked with a blocker reason
- request review
- complete with outcome/resolution

### Required task update fields
Every meaningful update should support some combination of:
- `status`
- `assigned_to`
- `resolution`
- `outcome`
- `error_message` or blocker reason
- comment/update text
- `updated_at`
- optional metadata such as `next_action`, `waiting_on`, `dispatch_session_id`, and progress context

### Workshop attention semantics
Needs Attention should include work that is:
- blocked
- overdue
- stale
- unassigned
- sitting in review too long

Celine Check should include work that needs judgment, triage, clarification, reassignment, escalation, or approval framing.

### Detail panel target behavior
The right-side detail panel should become the main operating surface and expose:
- current Workshop state
- owner
- latest update
- blocker reason
- next recommended action
- activity/comment timeline
- session or execution context when available

## Explicit v1 Deferrals
Do not pull these into the next implementation pass unless we intentionally reopen scope.

Deferred:
- complex automation builders
- dependency graph visualization
- nested subtasks as a major system
- time tracking
- advanced reporting or SLA layers
- many custom board modes
- reintroducing Claude/Hermes embedded sections on this page

## Design Principles
- execution first
- ownership visible
- blockers obvious
- low clutter
- Celine-first oversight
- opinionated by default
- minimal inherited Builderz noise

## Review Questions
To approve this spec, we should confirm:
1. Are the six v1 columns correct: Inbox, Ready, In Progress, Blocked, Review, Done?
2. Do we want project filtering kept as a secondary control or hidden for now?
3. Should the first implementation keep the existing modal-based detail flow temporarily, or should we go straight to a right-side detail panel?
4. Is `Celine Queue` the right name, or do you want a different label for chief-of-staff intervention work?

## Recommended Next Move After Approval
Once approved, implementation should begin with Phase 1 only.

That means:
- structural cleanup
- terminology cleanup
- column/status cleanup
- removal of the Claude/Hermes sections
- tighter top controls

Do not begin richer integrations until the Workshop base feels right.
