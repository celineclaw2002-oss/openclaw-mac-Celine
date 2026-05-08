## Part 2.5. Templates, Frontmatter Schema, and Sample Note Skeletons

This section turns the vault blueprint and integration architecture into an implementable operating standard.

The goal is to define:
- the exact template set
- the exact metadata schema
- the required and optional fields by note type
- sample note skeletons agents can reliably create and update
- a writing standard that keeps the vault clean under heavy automation

## Design goals for the 2.5 layer

This layer should make the vault:
- consistent enough for multiple agents to write safely
- structured enough for future retrieval and indexing
- readable enough for human oversight
- flexible enough to evolve as the agent system grows

The philosophy should be:
- strong defaults
- simple required fields
- richer optional fields where useful
- stable note structures
- low ambiguity for agents

## Template inventory

The recommended first template set is:

1. Daily Note Template
2. Project Note Template
3. Agent Note Template
4. Decision Note Template
5. Incident Note Template
6. Research Note Template
7. Runbook Note Template
8. Learning Note Template
9. Review Note Template
10. System / Architecture Note Template
11. Map of Content Template
12. Inbox Capture Template

## Global frontmatter schema

All structured notes should share a common core schema.

### Core required fields
```yaml
---
type:
title:
status:
created:
updated:
tags: []
---
```

### Core recommended fields
```yaml
---
owner:
system:
project:
agent:
priority:
risk:
related: []
review_date:
source_type:
source_links: []
visibility:
sensitivity:
allowed_agents: []
domain:
canonical: true
---
```

## Field definitions

### `type`
The canonical note type.

Allowed v1 values:
- `home`
- `inbox`
- `daily`
- `project`
- `system`
- `agent`
- `decision`
- `incident`
- `runbook`
- `research`
- `learning`
- `review`
- `map`
- `reference`

### `title`
Human-readable note title.

### `status`
High-level note state.

Suggested common values:
- `active`
- `draft`
- `planned`
- `open`
- `resolved`
- `archived`
- `evergreen`
- `deprecated`
- `superseded`

### `created`
ISO date or datetime.

### `updated`
ISO date or datetime.

### `tags`
Lightweight classification tags.
Do not overload tags with information already stored in frontmatter fields.

### `owner`
Primary human or agent owner.
Examples:
- `Can`
- `Celine`
- `Research Agent`

### `system`
Primary system the note belongs to.
Examples:
- `mission-control`
- `openclaw`
- `agent-memory`

### `project`
Associated project name if relevant.

### `agent`
Associated agent identity if relevant.

### `priority`
Optional urgency/importance field.
Suggested values:
- `low`
- `medium`
- `high`
- `critical`

### `risk`
Optional risk field.
Suggested values:
- `low`
- `medium`
- `high`
- `severe`

### `related`
Array of related note titles or identifiers.

### `review_date`
Optional future review date.

### `source_type`
Source origin for the note.
Examples:
- `agent-generated`
- `human-authored`
- `distilled-from-chat`
- `distilled-from-daily`
- `external-research`
- `system-generated`

### `source_links`
List of URLs, chat refs, or local references.

### `visibility`
Future-proof access concept.
Suggested values:
- `default`
- `restricted`
- `private-internal`

### `sensitivity`
Future-proof sensitivity concept.
Suggested values:
- `normal`
- `sensitive`
- `highly-sensitive`

### `allowed_agents`
Optional future allow-list.

### `domain`
Optional domain grouping.
Examples:
- `mission-control`
- `research`
- `security`
- `trading`
- `operations`

### `canonical`
Marks whether the note is the primary durable note for that entity.

## Type-specific frontmatter extensions

### Daily note
```yaml
---
type: daily
title: 2026-04-21
status: active
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: openclaw
tags: [daily, ops-log]
source_type: system-generated
canonical: true
---
```

### Project note
```yaml
---
type: project
title: Mission Control Migration
status: active
created: 2026-04-21
updated: 2026-04-21
owner: Can
system: mission-control
priority: high
risk: medium
project: Mission Control Migration
tags: [project, mission-control]
related: []
review_date: 2026-04-28
canonical: true
---
```

### Agent note
```yaml
---
type: agent
title: Celine
status: active
created: 2026-04-21
updated: 2026-04-21
owner: Can
system: openclaw
agent: Celine
domain: operations
tags: [agent, chief-of-staff]
visibility: default
sensitivity: normal
canonical: true
---
```

### Decision note
```yaml
---
type: decision
title: ADR-002 Obsidian as Institutional Brain
status: accepted
created: 2026-04-21
updated: 2026-04-21
owner: Can
system: mission-control
priority: high
risk: medium
tags: [decision, adr, knowledge-system]
review_date: 2026-06-01
canonical: true
---
```

### Incident note
```yaml
---
type: incident
title: Config Regression 2026-04-19
status: resolved
created: 2026-04-19
updated: 2026-04-21
owner: Celine
system: openclaw
priority: high
risk: high
tags: [incident, regression]
source_type: distilled-from-daily
canonical: true
---
```

### Research note
```yaml
---
type: research
title: Obsidian Research
status: evergreen
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: knowledge
priority: medium
risk: low
tags: [research, tools, obsidian]
source_type: external-research
source_links: []
canonical: true
---
```

### Runbook note
```yaml
---
type: runbook
title: OpenClaw Health Check
status: active
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: openclaw
priority: high
risk: medium
tags: [runbook, operations]
canonical: true
---
```

### Learning note
```yaml
---
type: learning
title: Best Practices for Safe Repo Changes
status: evergreen
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: openclaw
priority: medium
risk: medium
tags: [learning, best-practices, engineering]
source_type: distilled-from-daily
canonical: true
---
```

### Review note
```yaml
---
type: review
title: Weekly Ops Review 2026-W17
status: complete
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: openclaw
tags: [review, weekly]
canonical: true
---
```

### System note
```yaml
---
type: system
title: Mission Control Overview
status: active
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: mission-control
tags: [system, architecture, mission-control]
canonical: true
---
```

### Map note
```yaml
---
type: map
title: Map - Mission Control
status: active
created: 2026-04-21
updated: 2026-04-21
owner: Celine
system: mission-control
tags: [map, navigation]
canonical: true
---
```

### Inbox note
```yaml
---
type: inbox
title: Quick Capture 2026-04-21 21:30
status: draft
created: 2026-04-21T21:30:00-04:00
updated: 2026-04-21T21:30:00-04:00
owner: Celine
system: openclaw
tags: [inbox, capture]
source_type: agent-generated
canonical: false
---
```

## Template specs and sample note skeletons

### 1. Daily Note Template

```markdown
---
type: daily
title: {{date}}
status: active
created: {{date}}
updated: {{date}}
owner: Celine
system: openclaw
tags: [daily, ops-log]
source_type: system-generated
canonical: true
---

# {{date}}

## Summary
- 

## Key events
- 

## Active work
- 

## Incidents / issues
- 

## Research / findings
- 

## Decisions touched
- 

## Agent activity
- 

## Follow-ups
- 

## Related notes
- 
```

Use for:
- daily operational memory
- activity chronology
- handoffs
- recent context retrieval

### 2. Project Note Template

```markdown
---
type: project
title: {{title}}
status: active
created: {{date}}
updated: {{date}}
owner: 
system: 
project: {{title}}
priority: 
risk: 
tags: [project]
related: []
review_date: 
canonical: true
---

# {{title}}

## Summary

## Objective

## Why it matters

## Current status

## Scope

## Milestones
- 

## Risks
- 

## Dependencies
- 

## Related decisions
- 

## Related incidents
- 

## Related research
- 

## Next steps
- 
```

### 3. Agent Note Template

```markdown
---
type: agent
title: {{title}}
status: active
created: {{date}}
updated: {{date}}
owner: Can
system: openclaw
agent: {{title}}
domain: 
tags: [agent]
visibility: default
sensitivity: normal
allowed_agents: []
canonical: true
---

# {{title}}

## Summary

## Mission

## Scope

## Responsibilities
- 

## Inputs
- 

## Outputs
- 

## Tools
- 

## Permissions
- 

## Approval requirements
- 

## Escalation triggers
- 

## Failure modes
- 

## Reporting format
- 

## Related runbooks
- 

## Related systems and projects
- 

## Maturity / current status

## Next evolution steps
- 
```

### 4. Decision Note Template

```markdown
---
type: decision
title: {{title}}
status: accepted
created: {{date}}
updated: {{date}}
owner: 
system: 
priority: 
risk: 
tags: [decision, adr]
review_date: 
canonical: true
---

# {{title}}

## Summary

## Status

## Context

## Decision

## Alternatives considered
- 

## Why this was chosen

## Risks / tradeoffs
- 

## Implications
- 

## Review trigger

## Related notes
- 
```

### 5. Incident Note Template

```markdown
---
type: incident
title: {{title}}
status: open
created: {{date}}
updated: {{date}}
owner: 
system: 
priority: 
risk: 
tags: [incident]
source_type: distilled-from-daily
canonical: true
---

# {{title}}

## Summary

## Detection
- Date detected:
- Detected by:

## Symptoms
- 

## Impact
- 

## Systems affected
- 

## Timeline
- 

## Investigation notes
- 

## Root cause

## Mitigation
- 

## Permanent fix
- 

## Prevention ideas
- 

## Related runbooks
- 

## Related decisions / projects
- 
```

### 6. Research Note Template

```markdown
---
type: research
title: {{title}}
status: evergreen
created: {{date}}
updated: {{date}}
owner: 
system: 
priority: 
risk: low
tags: [research]
source_type: external-research
source_links: []
canonical: true
---

# {{title}}

## Question

## Short answer

## Findings
- 

## Relevance to our system

## Implications
- 

## Recommendation

## Sources
- 

## Follow-up questions
- 

## Related notes
- 
```

### 7. Runbook Note Template

```markdown
---
type: runbook
title: {{title}}
status: active
created: {{date}}
updated: {{date}}
owner: 
system: 
priority: 
risk: 
tags: [runbook]
canonical: true
---

# {{title}}

## Purpose

## When to use

## Preconditions
- 

## Required tools / access
- 

## Steps
1. 
2. 
3. 

## Validation
- 

## Rollback / recovery
- 

## Known pitfalls
- 

## Escalation path
- 

## Related incidents / notes
- 
```

### 8. Learning Note Template

```markdown
---
type: learning
title: {{title}}
status: evergreen
created: {{date}}
updated: {{date}}
owner: 
system: 
priority: medium
risk: medium
tags: [learning]
source_type: distilled-from-daily
canonical: true
---

# {{title}}

## Summary

## Lesson

## Why it matters

## Good behavior
- 

## Bad behavior / anti-pattern
- 

## Example situations
- 

## Operational guidance
- 

## Related incidents / decisions / runbooks
- 
```

### 9. Review Note Template

```markdown
---
type: review
title: {{title}}
status: complete
created: {{date}}
updated: {{date}}
owner: 
system: 
tags: [review]
canonical: true
---

# {{title}}

## Summary

## What happened in this period
- 

## What went well
- 

## What went poorly
- 

## Important decisions
- 

## Emerging risks
- 

## Lessons learned
- 

## Priority next steps
- 

## Related notes
- 
```

### 10. System / Architecture Note Template

```markdown
---
type: system
title: {{title}}
status: active
created: {{date}}
updated: {{date}}
owner: 
system: 
tags: [system, architecture]
canonical: true
---

# {{title}}

## Summary

## Purpose

## Core components
- 

## Data flow / logic flow
- 

## Boundaries
- 

## Risks / constraints
- 

## Related modules
- 

## Related runbooks
- 

## Related incidents / decisions
- 
```

### 11. Map of Content Template

```markdown
---
type: map
title: {{title}}
status: active
created: {{date}}
updated: {{date}}
owner: Celine
system: 
tags: [map, navigation]
canonical: true
---

# {{title}}

## Purpose

## Core notes
- 

## Key projects
- 

## Key systems
- 

## Key runbooks
- 

## Key incidents
- 

## Key decisions
- 

## Key research / learning notes
- 
```

### 12. Inbox Capture Template

```markdown
---
type: inbox
title: {{title}}
status: draft
created: {{datetime}}
updated: {{datetime}}
owner: 
system: 
tags: [inbox, capture]
source_type: agent-generated
canonical: false
---

# {{title}}

## Raw capture

## Why this might matter

## Suggested destination

## Related notes
- 
```

## Required fields by note type

### Minimal required fields for automation safety

#### Daily
- `type`
- `title`
- `status`
- `created`
- `updated`
- `tags`

#### Project
- core required fields
- `owner`
- `system`
- `project`

#### Agent
- core required fields
- `system`
- `agent`

#### Decision
- core required fields
- `system`

#### Incident
- core required fields
- `system`

#### Research
- core required fields
- `source_type`

#### Runbook
- core required fields
- `system`

#### Learning
- core required fields
- `system`

#### Review
- core required fields

#### System
- core required fields
- `system`

#### Map
- core required fields

#### Inbox
- core required fields
- `source_type`

## Writing rules for agents at the template level

### Rule 1. Do not invent structures
Agents should write using the closest approved template.

### Rule 2. Prefer canonical updates over note proliferation
If a note already exists for the entity, update it.

### Rule 3. Use inbox notes for uncertainty
If the agent cannot confidently classify the content, use Inbox rather than polluting core folders.

### Rule 4. Distill before promoting
Raw findings should become project, incident, runbook, decision, research, or learning notes only after basic structuring.

### Rule 5. Keep summaries tight and useful
Each note should open with a summary section that makes retrieval easier.

### Rule 6. Keep timestamps current
Whenever a note is materially updated, `updated` should be changed.

### Rule 7. Do not silently overwrite conclusions
For incidents, decisions, and governance notes, major conclusion changes should be explicit and auditable.

## Recommended v1 note creation policy

### Agent-autonomous creation
Safe by default:
- daily notes
- inbox notes
- research drafts
- incident drafts
- project status updates
- learning drafts

### Curated / reviewed promotion
Should often be reviewed by Celine:
- canonical runbooks
- canonical decision notes
- agent operating profiles
- governance/system doctrine
- final postmortems
- high-trust learning notes

## Example seed notes to create first

### `_System/Metadata Schema.md`
Should contain:
- allowed note types
- allowed status values
- field meanings
- examples

### `_System/Write Rules for Agents.md`
Should contain:
- when to update vs create
- allowed templates
- canonical note rules
- inbox fallback policy

### `_Templates/`
Should store one markdown file per template, named clearly.

Examples:
- `Daily Note Template.md`
- `Project Note Template.md`
- `Agent Note Template.md`
- `Decision Note Template.md`
- `Incident Note Template.md`
- `Research Note Template.md`
- `Runbook Note Template.md`
- `Learning Note Template.md`
- `Review Note Template.md`
- `System Note Template.md`
- `Map Template.md`
- `Inbox Capture Template.md`

## Recommended implementation order for templates

1. Daily
2. Project
3. Incident
4. Research
5. Runbook
6. Decision
7. Agent
8. Learning
9. Review
10. System
11. Map
12. Inbox

This order gives immediate practical value while supporting future governance and retrieval.

## Bottom line

This 2.5 layer is what makes the vault operationally usable under heavy agent authorship.

The combination of:
- clear templates
- stable frontmatter
- explicit note skeletons
- canonical note rules
- inbox fallback behavior

is what will let the knowledge system scale without collapsing into disorder.
