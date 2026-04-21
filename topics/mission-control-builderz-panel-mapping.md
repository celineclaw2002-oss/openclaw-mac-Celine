# Builderz to Mission Control V1 Panel Mapping

## Purpose

Translate the current Builderz Mission Control structure into the first buildable version of Can and Celine's Mission Control.

This document answers:
- what we keep
- what we rename
- what we hide or disable
- what we turn into custom Celine-first modules

## Mapping summary

Builderz gives us a strong operational shell. Mission Control v1 will use that shell, but reorganize it around governance, queues, and agent-managed execution rather than direct UI authority.

## Panel-by-panel mapping

### 1. Dashboard / Overview
**Builderz status:** Keep
**Mission Control v1:** `Overview Dashboard`
**Action:** Keep and customize

Use as the top-level command surface.

Add or emphasize:
- active agents
- pending approvals
- task pipeline summary
- upcoming cron jobs
- cost snapshot
- recent critical activity
- maintenance alerts

## 2. Agents
**Builderz status:** Keep
**Mission Control v1:** `Agents`
**Action:** Keep and customize

Use as the main roster view.

Add or emphasize:
- role / purpose
- agent status
- last activity
- current assignments
- linked logs or sessions

Future extension:
- connect into Agent Foundry

## 3. Tasks / Kanban
**Builderz status:** Keep
**Mission Control v1:** `Workshop`
**Action:** Keep, rename, and customize

Rename for the product language you want.

Default columns:
- inbox
- assigned
- in progress
- review
- blocked
- done

May later support specialized swimlanes by agent or project.

## 4. Scheduler / Cron
**Builderz status:** Keep
**Mission Control v1:** `Scheduler / Cron`
**Action:** Keep and customize

Keep recurring tasks visibility, but frame scheduled work as governed automations rather than autonomous background power.

Add:
- owner / responsible agent
- next run
- last result
- approval sensitivity flag if needed

## 5. Usage / Cost Tracking
**Builderz status:** Keep
**Mission Control v1:** `Usage / Cost`
**Action:** Keep and customize

Use as the financial and operational usage lens.

Add or emphasize:
- total cost trend
- per-model usage
- per-agent usage where possible
- spikes / anomalies

## 6. Chat / Comms
**Builderz status:** Keep
**Mission Control v1:** `Chat / Comms`
**Action:** Keep and customize

Use as the central communication layer.

Guardrails:
- no uncontrolled chatter
- tie updates to tasks, queues, and decisions when possible

## 7. Activity Feed
**Builderz status:** Keep
**Mission Control v1:** `Activity Feed`
**Action:** Keep and customize

Keep as the running operational timeline.

Highlight:
- agent actions
- task changes
- schedule runs
- warnings
- queue updates

## 8. Skills
**Builderz status:** Keep
**Mission Control v1:** `Skills`
**Action:** Keep and customize

Keep visibility into skills, but avoid UI-side unsafe installation/update behavior in early versions.

Preferred framing:
- skill inventory
- trust level
- source
- approval state

## 9. Memory Browser / Logs
**Builderz status:** Keep
**Mission Control v1:** `Memory / Knowledge`
**Action:** Keep and customize

Use this to expose:
- topic summaries
- durable memory
- recent progress
- linked operational notes

This is a strong differentiator for your workflow and should be made more central than it is in a generic dashboard.

## 10. Security / Health
**Builderz status:** Keep selectively
**Mission Control v1:** `Security / Health`
**Action:** Keep visibility, remove mutation authority

Keep:
- warnings
- scores
- observations
- recommended next action

Disable or remove:
- doctor fix
- one-click repairs
- direct mutation controls
- host-changing convenience buttons

## 11. Alerts / Notifications
**Builderz status:** Keep selectively
**Mission Control v1:** folded into `Overview`, `Chief of Staff Queue`, and `Activity Feed`
**Action:** Reduce as standalone surface unless it proves valuable

## 12. Pipelines / Orchestration
**Builderz status:** Keep selectively
**Mission Control v1:** partial keep
**Action:** Keep only where it supports governed workflows

Avoid letting orchestration become a hidden auto-mutation path.

## 13. Webhooks / Integrations
**Builderz status:** Keep later
**Mission Control v1:** likely `v1.5`
**Action:** Defer unless a specific integration becomes necessary immediately

## 14. Provisioning / Tenant / Super Admin flows
**Builderz status:** Hide or disable
**Mission Control v1:** not part of v1
**Action:** Disable in the fork

These are too risky and not core to the immediate personal Mission Control use case.

## Custom modules to add

## Intelligence
**Source:** Custom
**Mission Control v1:** Core
**Action:** Add new top-level module

Contents:
- suggested improvements
- feature ideas
- integration opportunities
- research findings
- architecture proposals

This is where Mission Control becomes strategically useful rather than merely operational.

## Agent detail extensions inside Agents
**Source:** Custom
**Mission Control v1:** Core
**Action:** Build into the Agents experience

For Celine specifically, the agent detail view should expose:
- current focus
- current project
- recent updates
- approvals or escalations needing review
- summary of Celine-related workload

For future specialist agents, the agent detail view should expose:
- purpose
- status
- current work
- recent updates
- task ownership and linked Workshop items

## Agent creation/foundry inside Agents
**Source:** Custom
**Mission Control v1:** Core
**Action:** Fold into Agents instead of using a separate top-level tab

Even if the underlying creation flow is simple at first, agent creation/configuration should live inside the Agents experience rather than as a separate navigation destination.

## Workshop as the queue system
**Source:** Existing Builderz tasks board, reshaped
**Mission Control v1:** Core
**Action:** Use as the main task and queue surface

Detailed queue views should live in Workshop, with:
- visible agent assignment
- filters by agent
- filters by project
- stage-based workflow

This avoids cluttering the app with separate top-level queue tabs for every agent.

## Disable-first list

The first features to disable, hide, or gate behind non-default internal-only use:
- doctor fix
- one-click repair
- auto-remediation
- provisioning and tenant management
- direct host mutations from UI
- unreviewed skill installation or mutation
- any route that assumes Mission Control itself is the repair authority

## Build order recommendation

### Pass 1 — Safe reshaping
- remove or hide dangerous actions
- rename navigation to Mission Control language
- decide the top nav / side nav structure

### Pass 2 — Core product identity
- tune Overview Dashboard
- tune Agents
- rename Tasks to Workshop
- tune Scheduler / Cron
- tune Usage / Cost
- centralize Activity Feed and Chat

### Pass 3 — Custom Celine-first modules
- Chief of Staff Queue
- Maintenance Queue
- Intelligence
- Agent Foundry

### Pass 4 — Hardening and refinement
- ensure no dangerous mutation path remains exposed
- improve module relationships
- prepare for later live integration and Mac mini deployment

## V1 navigation recommendation

Recommended primary nav order:
1. Overview
2. Agents
3. Workshop
4. Scheduler
5. Usage
6. Chat
7. Activity
8. Intelligence
9. Settings / Integrations as needed

## Immediate implementation next steps

1. Continue simplifying navigation around the clarified top-level structure.
2. Move Celine-specific queue concepts into the Agents detail experience.
3. Use Workshop as the detailed queue and task system for all agents.
4. Add Intelligence as the main custom top-level module.
5. Re-run isolated testing after each reshaping pass.
