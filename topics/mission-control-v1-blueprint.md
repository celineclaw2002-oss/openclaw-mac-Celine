# Mission Control V1 Blueprint

## Objective

Create the first real version of Mission Control for Can and Celine by forking `builderz-labs/mission-control` and reshaping it into a governed operational hub.

Mission Control v1 should be useful immediately, visually strong, and safe enough to evolve without giving the UI direct authority over the host.

## Core principle

Mission Control observes, organizes, and routes work.

It does not directly mutate the environment through one-click repair or auto-remediation flows.

## V1 success criteria

Mission Control v1 is successful if it:
- gives Can a clear top-level operational view
- shows agents, tasks, schedules, usage, and activity in one place
- supports a Celine-first governance model
- disables or avoids dangerous self-repair behaviors
- feels like the beginning of a real operating system for the agent team

## V1 page map

### 1. Overview Dashboard
Purpose:
- top-level system visibility
- current priorities
- agent status
- active schedules
- recent activity
- cost snapshot

Key widgets:
- system health summary
- active agents
- open tasks by stage
- upcoming cron/scheduled jobs
- token/cost summary
- recent alerts or warnings

### 2. Agents
Purpose:
- monitor the current agent roster
- view each agent’s purpose, status, current work, and updates
- become the unified place for agent detail and future creation/configuration over time

V1 features:
- list of agents
- status and last activity
- role / purpose
- current work summary
- linked tasks
- recent updates
- expandable or detailed view for each agent

Important notes:
- Celine-specific queue context should live inside the Celine agent detail view, not as a separate top-level tab.
- Agent creation or foundry capabilities should be folded into the Agents experience, not split into a second agent tab.

### 3. Workshop
Purpose:
- manage work as a kanban-style board
- track task progress across humans and agents
- serve as the main place for detailed queue and workload views

V1 features:
- inbox
- assigned
- in progress
- review
- blocked
- done
- visible agent assignment on tasks
- filtering by agent, project, or status

Important note:
- detailed queue views for Celine or any future agent should be represented through Workshop filtering and task ownership, not separate queue tabs.

### 4. Scheduler / Cron
Purpose:
- view recurring tasks and future scheduled work
- understand what automations are planned

V1 features:
- schedules list
- next run times
- owner / agent assignment
- status and last run outcome

### 5. Usage / Cost
Purpose:
- show model usage and cost trends
- make agent activity economically visible

V1 features:
- total usage summary
- per-model breakdown
- recent trend chart
- per-agent usage view if available

### 6. Chat / Comms
Purpose:
- centralize communication between Can, Celine, and agents

V1 features:
- high-level chat feed
- agent updates
- task-linked comments or threads
- communication visibility, not autonomous chat sprawl

### 7. Activity Feed
Purpose:
- show a live operational timeline

V1 features:
- recent events
- task changes
- agent state changes
- schedule runs
- warnings and system notices

### 8. Intelligence
Purpose:
- surface research, improvement ideas, feature proposals, and setup recommendations

V1 features:
- system improvement suggestions
- feature ideas
- integration opportunities
- skills or tools to evaluate
- strategic notes and architecture proposals

## Embedded and secondary capabilities

These should not be top-level tabs in the current information architecture:
- Skills Hub
- GitHub
- Audit
- Security
- Memory

Instead, they should become:
- embedded views
- secondary panels
- agent-driven capabilities
- or background/internal operational surfaces

## Agent-specific detail model

### Celine detail view inside Agents
Celine’s detailed agent view should show:
- purpose
- current project or focus
- what Celine is currently working on
- recent updates
- approvals or escalations needing attention
- a summary of Celine-owned or Celine-reviewed work

### Other agents inside Agents
Each specialist agent should eventually show:
- purpose
- status
- current work
- recent updates
- linked tasks in Workshop
- skills / model / governance data when relevant

## What gets disabled first

These should be hidden, disabled, or removed early in the fork:
- doctor fix
- one-click repairs
- auto-remediation
- direct host mutation from UI controls
- implicit provisioning flows
- any dangerous convenience action that changes live state without clear approval

## What gets customized first

Priority customization order:

1. Remove or hide dangerous repair actions
2. Reframe security/health as reporting instead of mutation
3. Simplify navigation around the clarified top-level structure
4. Strengthen Agents as the unified agent-detail surface
5. Use Workshop as the detailed queue and task system for all agents
6. Add Intelligence as the main custom top-level module
7. Clean up terminology and branding around Can, Celine, and the future agent team

## Governance model in V1

### Mission Control
- visibility
- routing
- approvals
- prioritization surfaces

### Specialist agents
- scoped execution
- investigation
- proposals
- maintenance tasks

### Celine
- orchestration
- review
- synthesis
- delegation and final internal checks

### Can
- final authority on important strategic, security, and host-impacting changes

## V1 vs later versions

### V1
- working forked UI base
- major operational pages visible
- dangerous self-repair removed or disabled
- Celine-first governance introduced
- Agents and Workshop clarified as the primary operating surfaces

### V1.5
- richer agent detail and configuration inside Agents
- maintenance workflow is routed through dedicated maintenance agent
- better cost and usage views
- more explicit approval paths

### V2
- full specialist agent lifecycle management
- deeper inter-agent coordination
- stronger intelligence/recommendation engine
- migration-aware deployment onto the Mac mini

## Build sequence recommendation

1. Fork Builderz into a controlled repo/worktree
2. Strip or disable dangerous mutation features first
3. Rename and reorganize navigation around the clarified V1 page map
4. Strengthen Agents detail and Workshop ownership model
5. Test isolated again
6. Iterate before any live integration

## Immediate next steps

1. Create a panel-by-panel mapping from current Builderz screens to Mission Control v1 pages.
2. Identify exact files/components tied to doctor fix and repair actions.
3. Decide the fork location and naming convention for the Mission Control codebase.
4. Start the first customization pass in isolation.
