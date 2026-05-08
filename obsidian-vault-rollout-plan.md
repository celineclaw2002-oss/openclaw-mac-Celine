# Obsidian Vault Rollout Plan for Mission Control and OpenClaw Agents

## Purpose

This document is the execution and rollout plan for introducing the Obsidian vault as the institutional knowledge layer for Mission Control and the broader OpenClaw agent system.

It is intentionally separate from the main blueprint/context document.

Reason for separation:
- the main blueprint document should remain the stable context/specification reference
- this rollout document should remain execution-oriented, phased, and implementation-focused
- coding agents such as Codex or Claude will work better when rollout sequencing, engineering scope, and implementation tradeoffs are isolated from the broader conceptual design material

## Relationship to the main blueprint

The main blueprint/context document defines:
- why the vault exists
- what role it plays
- how it should be structured
- how integration should work conceptually
- what note standards and templates exist

This rollout plan defines:
- what should be built first
- what should remain manual initially
- how the Mission Control backend should integrate with the vault
- how agent write/read workflows should be introduced safely
- how to evolve the system from simple file writes into a governed memory architecture

## Core rollout principles

### 1. The vault is infrastructure, not a sidecar toy
The vault should not be treated as a decorative documentation add-on.

It should become part of the operational backbone of the system.

That means Mission Control should gradually understand and use vault artifacts as meaningful system objects, even if the vault itself does not need its own standalone top-level tab at first.

### 2. The integration should be backend-first
This is important.

The rollout should prioritize:
- backend services
- file write/read discipline
- indexing and metadata handling
- linkage between tasks and vault artifacts
- retrieval and governance logic

UI should follow where useful, not lead.

### 3. It must be supervisor-agent neutral
The architecture should not assume that the lead supervisor is permanently Celine.

Instead, the system should refer conceptually to:
- the supervisor agent
- the chief-of-staff layer
- the orchestration supervisor

Celine may currently occupy that role, but the vault and Mission Control integration should remain reusable if the lead supervisor identity changes later.

### 4. No dedicated tab is required initially
A standalone vault tab is not required at first.

Instead, the vault should integrate into existing Mission Control features and backend logic such as:
- tasks
- agent profiles
- project objects
- incidents
- decisions
- research/intelligence feeds
- runbooks
- approvals
- activity logs

A memory-bank visualization may be useful later, but should follow meaningful data plumbing.

### 5. Rollout should begin simple and harden over time
The first version should not attempt to solve:
- perfect semantic search
- full permissions architecture
- automatic knowledge graph intelligence
- total automation of curation

The first version should solve:
- durable structured writing
- canonical note discipline
- retrieval of relevant recent and stable context
- linkage from operational entities to knowledge artifacts
- prevention of knowledge loss

## Target end state

The desired long-term state is:

- agents perform work through Mission Control / OpenClaw
- meaningful work produces structured vault artifacts
- Mission Control understands those artifacts as linked knowledge objects
- the supervisor agent can curate and promote knowledge quality
- future agents can retrieve relevant memory, doctrine, incidents, runbooks, and research
- the vault becomes a genuine institutional brain rather than a pile of markdown files

In that state:
- Mission Control is the operational operating system
- the vault is the knowledge operating system
- OpenClaw agents bridge the two through disciplined writing, retrieval, and curation

## Architecture overview for rollout

The rollout should introduce five backend capabilities in sequence.

### Capability 1. Vault storage conventions
Mission Control and OpenClaw need a shared understanding of:
- vault root path
- allowed folders
- note naming conventions
- template locations
- metadata expectations
- canonical note lookup behavior

### Capability 2. Artifact creation and update services
There should be backend functions/services that can:
- create notes from approved templates
- update canonical notes safely
- append to daily notes
- create incident/research/learning/project artifacts
- avoid duplicate note creation when a canonical note already exists

### Capability 3. Artifact linkage layer
Mission Control should be able to associate operational objects with vault artifacts.

Examples:
- task -> related note(s)
- project -> canonical project note
- incident record -> incident note/postmortem
- agent profile -> canonical agent note
- approval request -> related runbooks, incidents, and decisions

### Capability 4. Retrieval layer
A backend retrieval layer should support:
- path/metadata lookup
- canonical artifact lookup
- recent context retrieval
- structured related-note retrieval
- later semantic retrieval

### Capability 5. Curation and governance layer
A higher-order layer should support:
- promotion from raw capture to canonical knowledge
- note quality review
- doctrine and runbook governance
- restricted retrieval later if needed
- artifact completeness checks

## Recommended rollout phases

# Phase 0. Pre-implementation alignment

## Goal
Finalize conventions before writing production integration logic.

## Deliverables
- stable vault blueprint doc
- stable rollout plan doc
- confirmed folder and template set
- confirmed frontmatter schema
- confirmed canonical note rules
- confirmed supervisor-agent-neutral naming

## Required decisions
- where the vault will live on disk
- whether Mission Control points to the vault path directly or via config/env
- whether artifact linking will be stored in Mission Control DB, note frontmatter, or both
- how much initial automation is acceptable in v1

## Recommendation
At this stage, use configuration rather than hard-coding.

Suggested future config concepts:
- `vaultRoot`
- `vaultTemplatesPath`
- `vaultEnabled`
- `vaultWriteMode`
- `vaultIndexMode`

This makes the system portable and not tied to a single machine structure.

# Phase 1. Establish the vault as a real backend target

## Goal
Make the vault writable in a disciplined way from system workflows.

## Backend work
Implement a thin vault service in Mission Control backend or shared backend utilities.

Minimum responsibilities:
- resolve vault root
- validate target path
- create directories if missing
- read note files
- write note files
- append to note files safely
- stamp/update frontmatter fields
- generate filenames from titles/dates
- detect existing canonical note candidates

## Important design decision
This should be a general knowledge-artifact service, not a Celine-specific service.

Bad example:
- `celineMemoryService`

Better examples:
- `vaultArtifactService`
- `knowledgeArtifactService`
- `institutionalMemoryService`

This matters because the architecture should remain supervisor-neutral.

## Suggested backend abstractions
- `VaultService`
- `TemplateService`
- `ArtifactLinkService`
- `CanonicalNoteResolver`
- `FrontmatterService`

## First supported write operations
- append to daily note
- create project note
- update project note
- create incident note
- create research note
- create learning note
- create runbook draft
- create decision draft
- create/update agent note

## Initial guardrails
- never overwrite a canonical note without explicit intent
- preserve previous content when appending
- require note type and title
- validate allowed destination folder by note type
- log every write operation in Mission Control activity/audit history

## Mission Control integration points in phase 1
Not a dedicated tab yet.

Integrate quietly into:
- task completion hooks
- task milestone hooks
- incident creation flows
- agent creation/update flows
- project lifecycle flows
- research output flows
- review/postmortem workflows

## UI exposure in phase 1
Minimal.

Examples:
- “knowledge artifact created” badge in activity stream
- related note links on task detail pages
- artifact count on project and agent views

# Phase 2. Canonical artifact discipline and operational linking

## Goal
Make vault artifacts first-class linked objects inside Mission Control logic.

## Backend work
Add a linking model between operational entities and notes.

Possible model:
- `artifact_id`
- `artifact_type`
- `artifact_path`
- `artifact_title`
- `artifact_status`
- `artifact_note_type`
- `linked_entity_type`
- `linked_entity_id`
- `canonical`
- `created_at`
- `updated_at`

This can live in Mission Control DB while notes remain stored in the vault.

## Why this matters
Without a linkage layer, the vault stays external.
With a linkage layer, Mission Control can reason about knowledge outputs.

## Recommended linked entities
- tasks
- projects
- agents
- incidents
- approvals
- research items/intelligence items
- reviews

## Operational logic to add
- when a task closes, optionally check whether a durable artifact should exist
- when an incident is created, create or link the incident note
- when an agent profile is changed, update the canonical agent note
- when repeated procedures emerge, flag runbook debt
- when repeated failures emerge, flag learning note or postmortem debt

## Important product effect
This is how the vault becomes connected to Mission Control functions and features without needing its own major tab.

The connection happens through operational entities.

# Phase 3. Retrieval-aware workflows

## Goal
Use the vault to improve work quality before, during, and after execution.

## Backend work
Add retrieval APIs/utilities that can return context packets.

Examples:
- `getProjectContext(projectId)`
- `getIncidentContext(incidentId)`
- `getAgentOperatingContext(agentId)`
- `getApprovalContext(requestId)`
- `getRecentOperationalMemory(system, dateRange)`

## Retrieval packet contents
Depending on context, return:
- canonical notes
- recent daily notes
- related incidents
- related decisions
- related runbooks
- related learning notes
- related research notes

## Mission Control logic integration
Use these packets to enrich:
- task launches
- agent task assignments
- approval review screens
- incident investigation workflows
- project review screens
- research/intelligence workflows

## Important discipline
Retrieval should be typed and filtered.

Do not retrieve the whole vault for everything.

Filter by:
- entity type
- system
- project
- note type
- recency
- canonical status
- future access rules when needed

## Practical near-term use
Before an agent starts sensitive work, Mission Control can attach a context packet containing:
- the project note
- latest related incident
- relevant runbook
- prior decision notes
- one or two learning notes

That is much better than free-form vault searching.

# Phase 4. Curation and promotion workflows

## Goal
Prevent the vault from becoming a raw note dump by introducing promotion logic.

## Core idea
Not every note should be treated equally.

We need pathways from:
- raw capture -> working note
- working note -> canonical artifact
- canonical artifact -> archived artifact when superseded

## Backend/process work
Introduce curation jobs or workflows.

Possible future actions:
- identify duplicate project notes
- detect stale project summaries
- identify incidents with no postmortem
- identify repeated procedure patterns with no runbook
- identify major research outputs not linked to a project/decision
- detect large daily logs that should be distilled into stable artifacts

## Role of the supervisor agent
The supervisor agent should act as:
- curator
- promoter of durable knowledge
- reviewer of high-trust notes
- escalation point when curation decisions are ambiguous

This should be defined by role, not by the specific name Celine.

## Mission Control integration points
- curation queue in existing task/queue logic or future intelligence/review surfaces
- documentation debt indicators
- artifact quality checks
- reminders to convert important work into durable knowledge

# Phase 5. Memory-bank visualization and observability

## Goal
Give the system a useful visual understanding of the vault without turning it into a gimmick.

## Recommended concept
A “memory bank” visualization can be valuable if it shows operationally meaningful structure.

Not just a pretty graph.

Useful visual layers might include:
- projects linked to incidents, runbooks, decisions, and research
- agents linked to operating profiles, runbooks, and reviews
- system modules linked to incidents, decisions, and architecture notes
- note freshness / stale knowledge indicators
- canonical vs draft artifacts

## Suggested implementation order
### First visualization, simple and useful
A focused memory graph or relationship panel, not a full free-form graph explorer.

Examples:
- on a project page, show connected artifacts by type
- on an agent page, show linked runbooks, learning notes, and incidents
- on an incident page, show connected decisions, runbooks, and affected systems

### Later visualization
A broader graph view can come later once data quality is high enough.

This could resemble:
- artifact relationship graph
- memory freshness heatmap
- documentation debt map
- domain clusters

## Important warning
Do not build the graph first.

A graph without disciplined note linkage and artifact quality will look impressive and be operationally useless.

# Phase 6. Governance hardening and selective access

## Goal
Introduce stronger controls only when the system genuinely needs them.

## Trigger conditions
This phase becomes relevant when:
- trading material becomes sensitive
- security notes require tighter restrictions
- multiple specialized agents need differentiated retrieval scopes
- the system starts using semantic retrieval over larger and riskier note sets

## Backend work
Potential additions:
- note visibility filters
- domain-aware retrieval
- allow-list based filtering
- exclusion from semantic indexes
- review requirements for sensitive note changes

## Important design constraint
This should extend the system, not force a redesign.

That is why optional metadata fields and typed retrieval should exist from the beginning.

## Mission Control logic integration
- approval-aware retrieval
- restricted context packets
- warnings when sensitive artifacts are linked into broad tasks
- stronger audit trail for edits to sensitive knowledge

# Phase 7. Advanced intelligence and memory assistance

## Goal
Make the vault actively improve system performance, not just passively store notes.

## Future capabilities
- semantic search over selected domains
- knowledge gap detection
- automatic suggestion of related prior incidents/runbooks
- recommendation to create new runbooks or learning notes
- retrieval-aware task launching
- context bundle generation for newly spawned agents
- pre-flight knowledge checks for risky tasks

## Mission Control integration possibilities
- task launch suggests supporting knowledge artifacts
- approval screen shows similar historical cases
- agent creation flow suggests required runbooks and governance notes
- supervisor dashboard shows memory quality, coverage, and stale areas

This is where the vault starts to feel like a real institutional brain.

## Cross-cutting implementation details

### 1. Storage and path strategy
Recommendation:
- keep vault path configurable
- do not assume a hardcoded location
- support local file-based vault access first
- keep templates in a predictable subfolder

### 2. File format strategy
Use plain markdown + YAML frontmatter as the system of record.

This preserves:
- portability
- human readability
- Obsidian compatibility
- git compatibility
- external tooling compatibility

### 3. Database vs file boundaries
Recommended division:
- vault files hold durable knowledge content
- Mission Control DB holds operational links, indexes, and usage state

Do not try to store the full knowledge content in the Mission Control DB as the primary source.

### 4. Event model
A useful future event vocabulary might include:
- artifact_created
- artifact_updated
- artifact_linked
- artifact_promoted
- artifact_archived
- artifact_review_requested
- retrieval_context_generated
- documentation_debt_detected

These events can power activity feeds, audit logs, and later workflows.

### 5. Idempotency and duplication control
Very important for agent-written systems.

Needed safeguards:
- canonical lookup before create
- stable naming conventions
- path/type validation
- append vs replace discipline
- audit logs for major note mutations

### 6. Supervisor-agent neutrality
This needs to be explicit in the codebase and product language.

Avoid concepts like:
- `Celine memory`
- `Celine vault`
- `Celine knowledge graph`

Prefer:
- `supervisor artifact`
- `knowledge artifact`
- `vault artifact`
- `institutional memory`
- `supervisor review`

This matters because the architecture should survive future changes in supervisor identity.

## Suggested engineering sequence for Codex or Claude

If handing this to an implementation agent, I would recommend the following sequence.

### Sequence A. Foundational backend plumbing
1. add vault configuration model
2. implement vault service for read/write/append
3. implement frontmatter helper
4. implement template loader
5. implement filename/path resolver
6. implement canonical note resolver

### Sequence B. First operational integration
7. add daily note append hook
8. add project note create/update flow
9. add incident note create flow
10. add research note create flow
11. add artifact audit logging
12. add artifact link persistence in DB

### Sequence C. Mission Control entity integration
13. attach artifacts to tasks
14. attach canonical notes to projects/agents/incidents
15. expose artifact links in existing detail views
16. add artifact completeness checks

### Sequence D. Retrieval and curation
17. add typed retrieval APIs
18. add context packet generation
19. add documentation debt detection
20. add curation/review workflows

### Sequence E. Visualization and hardening
21. add relationship/memory-bank visualization
22. add stale artifact indicators
23. add future access filtering hooks
24. add optional semantic retrieval over selected domains

## Recommended MVP boundary

The MVP should not try to do everything.

### MVP should include
- configurable vault path
- markdown + frontmatter note creation/update
- daily/project/incident/research artifact support
- canonical note lookup
- DB linkage between tasks/projects/agents/incidents and vault artifacts
- minimal UI surfacing of related artifacts
- audit logging of artifact writes

### MVP should not include yet
- full graph explorer
- complete access-control engine
- deep semantic retrieval
- automated doctrine rewriting
- large-scale autonomous curation

## What success looks like after rollout begins

We should know the rollout is working if:
- meaningful work starts producing durable artifacts consistently
- fewer important insights remain trapped in chats
- project and incident continuity improves
- agents can retrieve better prior context before acting
- Mission Control surfaces knowledge links naturally in core workflows
- the supervisor agent can curate and promote institutional memory efficiently

## Key risks and mitigations

### Risk 1. The vault becomes a dumping ground
Mitigation:
- templates
- canonical note rules
- curation workflows
- documentation debt checks

### Risk 2. Mission Control treats the vault as external and optional
Mitigation:
- operational artifact linkage in DB
- backend hooks in task/project/incident flows
- artifact completeness checks

### Risk 3. The system becomes too Celine-specific
Mitigation:
- supervisor-neutral naming
- generic services and models
- role-based language in docs and code

### Risk 4. Overbuilding too early
Mitigation:
- phased rollout
- backend-first MVP
- no premature graph or permissions complexity

### Risk 5. Retrieval becomes noisy or unsafe
Mitigation:
- typed retrieval
- canonical-first logic
- metadata filters
- future-sensitive domain controls

## Final recommendation

Use the current main document as the stable context/specification document.

Use this rollout plan as the implementation document for coding agents.

That split is cleaner, easier to maintain, and more effective for implementation-focused models such as Codex or Claude.

## Bottom line

The rollout should make the vault an integrated backend knowledge substrate for Mission Control, not a separate note app living off to the side.

Mission Control should gradually gain the ability to:
- create knowledge artifacts
- link knowledge artifacts to operational entities
- retrieve knowledge artifacts as execution context
- measure documentation debt
- support supervisor-led curation
- later visualize the institutional memory graph in operationally useful ways

That is the path that turns Obsidian from a nice idea into real system infrastructure.
