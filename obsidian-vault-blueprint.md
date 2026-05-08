# Obsidian Vault Blueprint for Mission Control and OpenClaw Agents

## Purpose

This document is the primary planning record for the Obsidian vault that will support Mission Control and the broader OpenClaw agent ecosystem.

The vault is intended to function as:
- the institutional brain of the OpenClaw agent system
- the long-term memory substrate for agents
- a learning and upskilling layer for agent improvement
- a governed knowledge base for projects, architecture, runbooks, incidents, decisions, and research
- a companion knowledge system to Mission Control, which remains the execution and orchestration layer

## Core framing

### Obsidian's role
Obsidian should act as the knowledge authoring, navigation, and long-term memory interface.

### Mission Control's role
Mission Control should remain the execution, orchestration, approval, supervision, and operational control interface.

### Relationship between the two
- Obsidian = knowledge and memory layer
- Mission Control = command and operations layer

The vault should support retrieval, reuse, training, institutional memory, and quality improvement across the agent system.

## Agreed design decisions so far

### 1. Scope of the vault
The vault should encapsulate work relevant to OpenClaw agents and Mission Control.

It is not intended to be a personal life notebook for Can.

It should capture:
- agent work
- system knowledge
- architecture
- research
- incidents
- runbooks
- decisions
- learning artifacts
- operational and project memory

### 2. Primary author model
The vault should be designed assuming heavy automation and agent-written notes.

Can will mainly act as:
- observer
- moderator
- reviewer
- strategic decision-maker

This means the vault must be:
- highly structured
- machine-legible
- template-friendly
- safe for indexing and retrieval
- suitable for consistent writing by multiple agents

### 3. Optimization target
The vault should be optimized primarily for:
- agent upskilling
- memory retention
- system learning
- high-quality retrieval
- improving the OpenClaw system over time

Human readability still matters, but the primary goal is a strong institutional brain for the agent ecosystem.

### 4. Access control stance
The vault should remain a single coherent vault for now.

We should not make strict knowledge zones a foundational design constraint yet, because the future agent roster and operating model are still evolving.

However, the design should remain future-compatible with selective access.

Recommended future-proof metadata fields include:
- `visibility`
- `domain`
- `allowed_agents`
- `sensitivity`

These should exist as optional fields in v1, not mandatory constraints.

### 5. Structural philosophy
The agreed structural approach is hybrid.

This means the vault should combine:
- functional folders
- structured note types
- metadata
- linking

Why hybrid:
- folder-only systems become rigid
- metadata-only systems become abstract and annoying
- link-only systems become messy
- hybrid preserves usability, automation, and later extensibility

## High-level vault philosophy

The vault should serve five major jobs:

1. Memory
   - what happened
   - what mattered
   - what should be remembered

2. Intelligence
   - research findings
   - tool evaluations
   - architectural insights
   - future opportunities

3. Operations
   - runbooks
   - incident records
   - debugging history
   - migration memory

4. Architecture
   - systems
   - modules
   - agent definitions
   - policies
   - governance

5. Planning and learning
   - projects
   - reviews
   - lessons learned
   - best practices
   - training material

## Concrete vault blueprint

### Top-level structure

```text
00 Home/
01 Inbox/
02 Daily/
03 Projects/
04 Mission Control/
05 Agents/
06 Knowledge/
07 Decisions/
08 Runbooks/
09 Incidents/
10 Research/
11 Learning/
12 Reviews/
13 Assets/
99 Archive/
_Maps/
_Templates/
_System/
```

## Folder-by-folder blueprint

### 00 Home/
Vault entry and orientation layer.

Purpose:
- dashboards
- navigation
- active priorities
- quick links to live systems and work

Suggested core notes:
- `Home.md`
- `Current Focus.md`
- `Active Systems.md`
- `Open Questions.md`

### 01 Inbox/
Temporary intake and unprocessed capture.

Use for:
- raw agent dumps
- quick findings
- rough notes
- copied logs
- early ideas needing sorting

Rule:
Nothing important should live here permanently.

### 02 Daily/
Operational daily memory written mostly by agents.

Purpose:
- daily activity logs
- system memory rolls
- debugging progress
- notable events
- research summaries
- handoff context

These are not personal journals. They are operational records.

Suggested structure:
```text
02 Daily/
  2026/
    2026-04-21.md
    2026-04-22.md
```

### 03 Projects/
Canonical notes for initiatives and multi-step workstreams.

Examples:
- `Mission Control Migration.md`
- `Mac Mini Migration.md`
- `Trading Agent Pilot.md`
- `Agent Memory System.md`

Each project note should act as the reference hub for:
- objective
- status
- milestones
- risks
- linked decisions
- linked incidents
- related research
- next steps

### 04 Mission Control/
Dedicated documentation space for the Mission Control system itself.

Suggested subfolders:
```text
04 Mission Control/
  Architecture/
  Modules/
  Governance/
  Integrations/
  Roadmap/
  Data Model/
  UX/
```

Examples:
- `Mission Control Overview.md`
- `Operating Blueprint.md`
- `Approval Matrix.md`
- `Workshop Queue Logic.md`
- `Scheduler Model.md`
- `Intelligence Inbox Design.md`

### 05 Agents/
Canonical registry and operating profiles for all agents.

Suggested subfolders:
```text
05 Agents/
  Active/
  Planned/
  Retired/
  Shared Protocols/
  Evaluations/
```

Examples:
- `Celine.md`
- `Research Agent.md`
- `Personal Assistant Agent.md`
- `Trading Agent.md`
- `Mission Control Coding Specialist.md`

Purpose:
- define role
- define authority
- define tools
- define reporting
- document maturity and risks

### 06 Knowledge/
Evergreen internal doctrine and reusable understanding.

Suggested subfolders:
```text
06 Knowledge/
  Concepts/
  Systems/
  Standards/
  Reference/
  Glossary/
```

Examples:
- `Agent Governance Principles.md`
- `Rollback Philosophy.md`
- `Autonomy vs Approval.md`
- `Mission Control Vocabulary.md`

### 07 Decisions/
Durable decision log.

Suggested subfolders:
```text
07 Decisions/
  Strategic/
  Technical/
  Operational/
```

Examples:
- `ADR-001 Mission Control as Operating Layer.md`
- `ADR-002 Obsidian as Institutional Brain.md`
- `ADR-003 Isolated Builderz Fork Policy.md`

Purpose:
- preserve rationale
- reduce memory loss
- avoid repeated debate without history

### 08 Runbooks/
Repeatable procedures and operational instructions.

Suggested subfolders:
```text
08 Runbooks/
  Setup/
  Operations/
  Recovery/
  Deployment/
  Safety/
```

Examples:
- `Mission Control Local Launch.md`
- `OpenClaw Health Check.md`
- `Safe Evaluation Procedure.md`
- `Mac Mini Migration Cutover.md`

### 09 Incidents/
Failure memory and debugging history.

Suggested subfolders:
```text
09 Incidents/
  Open/
  Resolved/
  Postmortems/
```

Examples:
- `Config Regression 2026-04-19.md`
- `Timeout Failure Investigation.md`
- `Terminal and Image Breakage Postmortem.md`

Purpose:
- root cause tracking
- remediation memory
- prevention knowledge

### 10 Research/
Research and evaluation layer.

Suggested subfolders:
```text
10 Research/
  Tools/
  Architecture/
  Workflows/
  Experiments/
  Comparisons/
```

Examples:
- `Obsidian Research.md`
- `Mission Control Alternatives.md`
- `Agent Memory Patterns.md`
- `Knowledge Retrieval Models.md`

### 11 Learning/
Dedicated upskilling and agent improvement layer.

Suggested subfolders:
```text
11 Learning/
  Lessons Learned/
  Best Practices/
  Failure Patterns/
  Exemplars/
  Training Packs/
```

Examples:
- `How to Write Better Incident Notes.md`
- `Common Failure Pattern: Premature Assumptions.md`
- `Best Practices for Safe Repo Changes.md`
- `Good vs Bad Research Summaries.md`

This folder is a major priority because the vault should not only store memory, but also improve the quality of future agent work.

### 12 Reviews/
Periodic synthesis and oversight.

Suggested subfolders:
```text
12 Reviews/
  Weekly/
  Monthly/
  Project Reviews/
  System Reviews/
```

Examples:
- `Weekly Ops Review 2026-W17.md`
- `Mission Control Governance Review.md`
- `Migration Readiness Review.md`

### 13 Assets/
Attachments and supporting materials.

Suggested subfolders:
```text
13 Assets/
  Screenshots/
  Diagrams/
  PDFs/
  Exports/
  Logs/
```

### 99 Archive/
Retired material to preserve history without clutter.

Suggested subfolders:
```text
99 Archive/
  Projects/
  Agents/
  Research/
  Incidents/
  Decisions/
```

### _Maps/
Maps of Content for curated navigation.

Examples:
- `Map - Mission Control.md`
- `Map - Agents.md`
- `Map - Research.md`
- `Map - Learning.md`

### _Templates/
Template library for structured note creation.

Planned templates:
- Daily Note
- Project Note
- Agent Note
- Decision Note
- Incident Note
- Research Note
- Runbook Note
- Learning Note
- Review Note
- System Note
- MOC Note

### _System/
Vault infrastructure and standards.

Examples:
- `Vault Conventions.md`
- `Metadata Schema.md`
- `Tag Taxonomy.md`
- `Write Rules for Agents.md`
- `Dashboard Queries.md`

## Core note types

Recommended canonical note types:
- `home`
- `inbox`
- `daily`
- `project`
- `system`
- `agent`
- `decision`
- `runbook`
- `incident`
- `research`
- `learning`
- `review`
- `map`
- `reference`

Every substantial note should declare a note type in frontmatter.

## Metadata blueprint

### Required core fields for most structured notes
```yaml
---
type:
title:
status:
created:
updated:
tags:
---
```

### Recommended optional common fields
```yaml
---
owner:
system:
project:
agent:
priority:
risk:
related:
review_date:
source_type:
visibility:
sensitivity:
allowed_agents:
domain:
---
```

Important:
- `visibility`, `sensitivity`, `allowed_agents`, and `domain` should be available in v1 as optional future-proofing
- these should not be mandatory yet

## Naming conventions

### General notes
Use clear, human-readable titles:
- `Mission Control Operating Blueprint`
- `Mac Mini Migration`
- `Research Agent`
- `Config Regression 2026-04-19`

### Decisions
Use ADR-style prefixes:
- `ADR-001 Mission Control as Operating Layer`
- `ADR-002 Obsidian as Institutional Brain`

### Incidents
Use descriptive titles with date:
- `Config Regression 2026-04-19`
- `Mission Control Timeout Failure 2026-04-21`

### Daily notes
Use ISO date only:
- `2026-04-21`
- `2026-04-22`

## Linking rules

The vault should be richly linked, but not cluttered with unnecessary links.

Preferred linking targets include:
- projects
- systems
- agents
- incidents
- decisions
- runbooks
- research notes
- learning notes when relevant

Examples:
- a daily note links to affected projects, incidents, decisions, and agents
- a runbook links to the system it serves and incidents that informed it
- an agent note links to governance principles, approval rules, and supporting runbooks

## Write rules for agents

1. Prefer updating canonical notes over creating duplicates.
2. One durable entity should have one primary note.
3. Raw dumps go to Inbox or Assets, not to core knowledge folders.
4. Procedural material belongs in Runbooks.
5. Lessons and best practices belong in Learning, not only in Daily.
6. Direction-changing choices belong in Decisions.
7. Daily notes are event logs, not the only home of important knowledge.
8. Important knowledge should be distilled from daily logs into stable notes.

## Mapping from the current workspace

This blueprint aligns well with the current OpenClaw workspace patterns.

### Existing memory files
Current pattern:
- `memory/YYYY-MM-DD.md`

Maps to:
- `02 Daily/`

### Existing topic files
Current pattern:
- `topics/*.md`

Maps across:
- `03 Projects/`
- `04 Mission Control/`
- `06 Knowledge/`
- `07 Decisions/`
- `08 Runbooks/`

Depending on note purpose.

### Relevant current Mission Control material already identified
Examples already present in the workspace include:
- `topics/mission-control.md`
- `topics/mission-control-operating-blueprint.md`
- `topics/mission-control-roadmap.md`
- `topics/mission-control-runtime-health-check.md`
- `topics/mission-control-builderz-evaluation-checklist.md`
- `topics/mission-control-backup-diff-procedure.md`
- `memory/2026-04-09-mission-control.md`
- `memory/2026-04-19-mission-control.md`
- `memory/2026-04-21-mission-control.md`

This means the vault design is not starting from scratch. It is a formalization of patterns already emerging in the current system.

## Minimum viable v1 vault

If we want the smallest serious version, use:

```text
00 Home/
01 Inbox/
02 Daily/
03 Projects/
04 Mission Control/
05 Agents/
06 Knowledge/
07 Decisions/
08 Runbooks/
09 Incidents/
10 Research/
11 Learning/
12 Reviews/
13 Assets/
_Maps/
_Templates/
_System/
99 Archive/
```

## Recommended first folders to create in practice
- `00 Home`
- `02 Daily`
- `03 Projects`
- `04 Mission Control`
- `05 Agents`
- `07 Decisions`
- `08 Runbooks`
- `09 Incidents`
- `10 Research`
- `11 Learning`
- `_Templates`
- `_System`

## Recommended first seed notes
- `00 Home/Home.md`
- `04 Mission Control/Mission Control Overview.md`
- `05 Agents/Active/Celine.md`
- `07 Decisions/ADR-001 Mission Control as Operating Layer.md`
- `07 Decisions/ADR-002 Obsidian as Institutional Brain.md`
- `08 Runbooks/OpenClaw Health Check.md`
- `10 Research/Tools/Obsidian Research.md`
- `11 Learning/Lessons Learned/Knowledge System Principles.md`
- `_System/Vault Conventions.md`
- `_System/Metadata Schema.md`

## Summary

This blueprint is intended to create a disciplined, automation-friendly, agent-centric institutional brain for Mission Control and the OpenClaw ecosystem.

It preserves the structure and direction we agreed upon:
- high structure
- hybrid organization
- automation-first design
- strong support for memory and upskilling
- future compatibility with selective access, without prematurely enforcing it

This document should serve as the primary reference until implementation begins, and should be updated as the integration architecture and rollout plan are defined.
