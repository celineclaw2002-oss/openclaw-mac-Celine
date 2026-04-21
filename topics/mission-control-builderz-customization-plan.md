# Builderz Mission Control Customization Plan

## Summary

Use `builderz-labs/mission-control` as the visual and structural base, but fork and reshape it so that Celine remains the governing layer instead of letting the UI mutate the environment directly.

## Guiding principle

Mission Control should observe, organize, and coordinate. It should not independently repair, rewrite, or reconfigure the live system.

## Primary objective

Turn Builderz from an all-in-one operational control plane into a governed Mission Control for Can, where:
- specialist agents do scoped maintenance and improvement work
- Celine reviews and synthesizes
- Can remains the final authority for risky actions

## Keep

These parts are directionally strong and should remain in some form:
- dashboard shell and navigation structure
- agents view
- task / kanban / workshop views
- scheduler / cron visibility
- usage and cost tracking
- chat / communications surfaces
- memory and logs visibility
- skills visibility and discovery
- activity stream
- security and health visibility as reporting panels

## Disable or remove

These parts are too dangerous or too opinionated for this setup and should be disabled, hidden, or removed in the fork:
- `doctor fix`
- one-click repair flows
- auto-remediation from the UI
- environment mutation without explicit workflow approval
- direct host-changing convenience actions
- any feature that silently rewrites OpenClaw config or state
- provisioning flows that assume they control the host lifecycle

## Replace with governed workflows

### 1. Maintenance agent workflow
Replace direct repair buttons with:
- issue surfaced in Mission Control
- maintenance agent investigates
- maintenance agent proposes action plan
- Celine reviews and translates recommendation
- Can approves if risk is material

### 2. Change queue
Create a queue for:
- suggested fixes
- configuration changes
- upgrades
- security recommendations
- Mission Control improvements

This queue should be reviewable, auditable, and not self-executing.

### 3. Approval routing
Introduce approval levels:
- low-risk internal UI/data changes
- medium-risk local environment changes
- high-risk host, gateway, security, or service changes

High-risk actions should never execute directly from Mission Control without explicit approval.

### 4. Health reporting instead of health mutation
Keep warnings and audits, but present them as:
- status
- explanation
- recommended owner
- recommended next action

Not as one-click mutation buttons.

## Suggested Mission Control v1 modules

### Core modules for v1
- Overview Dashboard
- Agents
- Workshop / Kanban
- Scheduler / Cron
- Usage / Cost Tracking
- Chat / Comms
- Activity Feed
- Memory / Knowledge View
- Skills
- Security / Health Reporting

### Custom Celine-first modules
- **Chief of Staff Queue**
  - inbound requests
  - pending approvals
  - escalations
  - blocked items

- **Agent Foundry**
  - create specialist agents
  - define purpose
  - assign skills
  - assign model and guardrails
  - set review rules

- **Intelligence**
  - suggested improvements to OpenClaw setup
  - research findings
  - upgrade opportunities
  - feature proposals

- **Maintenance Queue**
  - host issues
  - suggested fixes
  - deferred infrastructure tasks
  - Mac mini migration prep

## Governance model

### Layer 1 — Mission Control UI
Responsible for:
- visibility
- task coordination
- planning
- status aggregation
- approval collection

### Layer 2 — Specialist agents
Responsible for:
- investigation
- implementation proposals
- scoped maintenance work
- feature development

### Layer 3 — Celine
Responsible for:
- orchestration
- synthesis
- prioritization
- final review before escalation to Can

### Layer 4 — Can
Responsible for:
- final approval on important system, security, or strategic changes

## What to avoid in the fork

- overloading Mission Control with direct system power
- duplicate authority between UI and Celine
- self-modifying automation loops
- anything that makes host breakage one click away
- tightly coupling the UI to one fragile repair path

## Recommended near-term implementation approach

### Phase 1
- keep Builderz isolated
- identify and hide dangerous repair/provisioning surfaces
- map the existing panels to desired Mission Control modules

### Phase 2
- fork the repo
- remove or disable doctor/auto-fix/remediation actions
- relabel health panels as reporting and recommendation panels
- introduce placeholders for Chief of Staff Queue, Intelligence, and Agent Foundry

### Phase 3
- wire custom workflows through agents rather than UI-side mutation
- add approval routing
- add maintenance queue and governance metadata

### Phase 4
- prepare migration-aware deployment plan for the future Mac mini

## Decision

Builderz is worth using as a base only if it becomes a governed fork, not a directly trusted operational authority.

## Next Steps

1. Create a panel-by-panel mapping of Builderz pages to the desired Mission Control v1 structure.
2. Identify which Builderz components/actions should be hidden first in a fork.
3. Design the custom modules: Chief of Staff Queue, Agent Foundry, Intelligence, Maintenance Queue.
4. Decide whether to fork now or continue isolated evaluation a bit further first.
