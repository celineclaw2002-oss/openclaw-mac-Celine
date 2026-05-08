# Obsidian Vault Engineering Execution Backlog and Implementation Brief

## Purpose

This document translates the Obsidian vault blueprint and rollout plan into concrete engineering work for implementation agents such as Codex or Claude.

It is intended to function as:
- a sequenced engineering backlog
- an implementation brief
- an execution reference for backend and product integration work

This document should be read alongside:
1. the main context/specification document
2. the rollout plan document

Those documents explain the strategy and architecture.
This document explains what to build.

## Primary goal

Build the Obsidian vault into Mission Control and the OpenClaw ecosystem as a real backend knowledge substrate, not as a detached notes feature.

The implementation must:
- integrate with Mission Control backend logic and operational objects
- avoid assuming a Celine-specific architecture
- support a general supervisor-agent role
- preserve the vault as the durable knowledge and memory layer
- keep Mission Control as the orchestration and operational control layer
- enable future visualization of a memory bank / relationship graph
- avoid overbuilding unnecessary UI or permissions complexity too early

## Non-goals for the first implementation wave

Do not prioritize these in the MVP:
- full standalone vault tab
- full semantic search stack
- deep permissions engine
- fully autonomous knowledge curation
- flashy graph explorer without strong data quality
- storing primary knowledge content in the Mission Control DB instead of markdown files

## Architectural constraints to preserve

### 1. Layer separation
- Vault = knowledge, memory, learning, docs, retrieval substrate
- Mission Control = operations, orchestration, approvals, supervision, runtime state
- OpenClaw agents = workers and knowledge producers/consumers

### 2. Supervisor neutrality
Do not implement the architecture as Celine-specific.

Avoid names like:
- `celineMemoryService`
- `celineVault`
- `celineKnowledgeGraph`

Prefer names like:
- `VaultService`
- `KnowledgeArtifactService`
- `ArtifactLinkService`
- `SupervisorReviewPolicy`

### 3. Backend-first integration
The vault should connect to backend workflows before it gets major dedicated UI surface area.

### 4. Markdown as source of truth
Durable knowledge content should live in markdown + frontmatter inside the vault.
Mission Control DB should store links, metadata caches, and operational associations, not replace the vault as primary knowledge storage.

### 5. Canonical artifact discipline
Where possible, one durable entity should map to one canonical note.

Examples:
- one project -> one canonical project note
- one incident -> one canonical incident note/postmortem
- one agent -> one canonical agent profile note
- one decision -> one canonical decision note

## Summary of features that must be represented in the implementation

The implementation should account for all of the following themes discussed so far:
- Obsidian as institutional brain, not personal notebook
- heavy automation / agent-authored notes
- high-structure vault with templates and frontmatter
- hybrid organization using folders + metadata + links
- future-compatible selective access without making it a v1 constraint
- Mission Control backend integration without requiring a dedicated vault tab
- supervisor-agent neutrality instead of Celine-specific assumptions
- artifact linkage to tasks, projects, incidents, agents, approvals, research, and reviews
- retrieval-aware workflows using typed/contextual knowledge packets
- promotion from raw notes to canonical institutional knowledge
- documentation debt detection
- future memory-bank visualization once underlying data quality is strong enough
- auditability and governance for higher-trust artifacts

## Delivery strategy

This work should be split into five implementation tracks:

1. Core vault infrastructure
2. Artifact creation and canonical note management
3. Mission Control linkage and backend workflow integration
4. Retrieval and curation support
5. Visualization and future hardening hooks

---

# Part I. Sequenced engineering backlog

## Epic 1. Vault foundation and shared configuration

### Task 1.1. Add vault configuration model
**Goal:** allow Mission Control to know whether a vault is enabled and where it lives.

**Requirements:**
- add config/env support for vault enablement and root path
- include template path configuration
- include write mode / index mode flags if helpful
- do not hardcode machine-specific paths

**Suggested config concepts:**
- `vaultEnabled`
- `vaultRoot`
- `vaultTemplatesPath`
- `vaultWriteMode`
- `vaultIndexMode`

**Acceptance criteria:**
- backend can load vault config safely
- app behaves predictably when vault is disabled
- path resolution is centralized

### Task 1.2. Implement `VaultService`
**Goal:** provide a backend service for filesystem interaction with the vault.

**Capabilities:**
- resolve vault root
- validate target paths
- read note contents
- write new notes
- append to notes
- create directories when missing
- support UTF-8 markdown files safely

**Acceptance criteria:**
- service supports create/read/update/append primitives
- invalid paths are rejected
- note writes cannot escape configured vault root

### Task 1.3. Implement `FrontmatterService`
**Goal:** parse and update YAML frontmatter consistently.

**Capabilities:**
- parse frontmatter into structured object
- merge/update fields
- preserve markdown body
- stamp `updated` automatically when configured
- validate required fields by note type

**Acceptance criteria:**
- frontmatter round-trip works reliably
- required fields can be validated
- malformed frontmatter errors are explicit

### Task 1.4. Implement `TemplateService`
**Goal:** create notes from controlled templates.

**Capabilities:**
- load template markdown files
- fill placeholders like date/title/system
- return rendered note content
- support note-type-specific defaults

**Acceptance criteria:**
- template rendering works for core note types
- missing placeholders are handled clearly
- template source is configurable

### Task 1.5. Implement filename and path resolver
**Goal:** standardize where notes live and how they are named.

**Capabilities:**
- resolve folder by note type
- generate filenames from title/date rules
- enforce naming conventions
- support daily-note path generation

**Acceptance criteria:**
- every note type has deterministic routing
- naming matches agreed conventions
- collisions are handled sensibly

## Epic 2. Canonical artifact and note lifecycle support

### Task 2.1. Implement `CanonicalNoteResolver`
**Goal:** identify whether a durable entity already has a canonical note.

**Capabilities:**
- look up by linked entity ID if available
- look up by note type + title + metadata fallback
- distinguish canonical from draft notes
- support future DB-assisted lookup

**Acceptance criteria:**
- duplicate canonical note creation is reduced/prevented
- resolver works for project, agent, incident, and decision note families

### Task 2.2. Implement `KnowledgeArtifactService`
**Goal:** create and update vault artifacts at the business-logic layer.

**Capabilities:**
- create artifact from template
- update canonical artifact
- append to daily note
- create draft vs canonical artifacts
- expose typed operations by artifact class

**Suggested first operations:**
- `appendDailyLogEntry`
- `createOrUpdateProjectArtifact`
- `createIncidentArtifact`
- `createResearchArtifact`
- `createLearningArtifact`
- `createRunbookDraft`
- `createDecisionDraft`
- `createOrUpdateAgentArtifact`

**Acceptance criteria:**
- business logic can request typed note actions without manipulating files directly
- artifact operations log what they changed

### Task 2.3. Implement note-type validation rules
**Goal:** enforce minimum structure for automated note creation.

**Requirements:**
- validate required frontmatter by note type
- prevent unsupported note types from being written
- support warning vs hard-fail mode if needed

**Acceptance criteria:**
- invalid artifacts are rejected or flagged clearly
- generated notes always meet minimum schema

### Task 2.4. Implement lifecycle status helpers
**Goal:** support transitions like draft -> active -> archived.

**Requirements:**
- utility functions for note status changes
- explicit promotion helpers for canonical artifacts
- archive helpers later if needed

**Acceptance criteria:**
- status handling is standardized
- services do not hardcode ad hoc status transitions

## Epic 3. Artifact linkage inside Mission Control backend

### Task 3.1. Add artifact linkage model to Mission Control DB
**Goal:** store operational relationships between Mission Control entities and vault artifacts.

**Suggested fields:**
- `artifact_id`
- `artifact_type`
- `artifact_path`
- `artifact_title`
- `artifact_note_type`
- `artifact_status`
- `linked_entity_type`
- `linked_entity_id`
- `canonical`
- `created_at`
- `updated_at`

**Acceptance criteria:**
- tasks, projects, agents, incidents, and approvals can be associated with artifacts
- links survive restarts and do not rely only on filename heuristics

### Task 3.2. Implement `ArtifactLinkService`
**Goal:** manage DB linkage between operational objects and vault artifacts.

**Capabilities:**
- create links
- update links
- fetch linked artifacts by entity
- fetch entities linked to artifact
- mark canonical relationship

**Acceptance criteria:**
- backend can query related artifacts efficiently
- link creation/update is auditable

### Task 3.3. Add audit events for artifact operations
**Goal:** preserve traceability for vault interactions.

**Events to support early:**
- `artifact_created`
- `artifact_updated`
- `artifact_linked`
- `artifact_review_requested`

**Acceptance criteria:**
- artifact writes appear in logs/activity stream/audit subsystem
- major changes are traceable

## Epic 4. First workflow integrations

### Task 4.1. Daily-note append hook for task or activity completion
**Goal:** create immediate durable operational memory.

**Trigger candidates:**
- task completion
- milestone completion
- meaningful activity event

**Behavior:**
- append concise structured entry to the current daily note
- optionally include links to task/project/agent

**Acceptance criteria:**
- meaningful work begins producing durable daily records automatically
- logs are structured, not noisy free text

### Task 4.2. Project artifact integration
**Goal:** connect project lifecycle updates to project notes.

**Behavior:**
- create project note if absent
- update project note on major status/milestone changes
- link project entity to canonical note

**Acceptance criteria:**
- active projects have linked project artifacts
- project summaries stay closer to current reality

### Task 4.3. Incident artifact integration
**Goal:** ensure meaningful failures generate durable incident memory.

**Behavior:**
- create incident note on incident creation
- support later postmortem/promotion flow
- link incident entity to artifact

**Acceptance criteria:**
- incidents are no longer trapped only in chat/logs
- incident detail view can access related note link

### Task 4.4. Agent artifact integration
**Goal:** maintain canonical operating profiles for agents.

**Behavior:**
- create/update agent note when agent is created or materially changed
- link agent entity to note

**Acceptance criteria:**
- each important agent has a canonical profile note
- profile changes can be reflected durably

### Task 4.5. Research artifact integration
**Goal:** make research outputs durable and linkable.

**Behavior:**
- allow structured research note creation from research workflows
- link to project/system/decision when applicable

**Acceptance criteria:**
- meaningful research outputs are represented as artifacts
- research can later feed intelligence surfaces cleanly

## Epic 5. Minimal UI surfacing without a dedicated vault tab

### Task 5.1. Show related artifacts on entity detail surfaces
**Goal:** expose vault linkage naturally inside existing Mission Control views.

**Suggested surfaces:**
- task detail
- project detail
- agent detail
- incident detail
- approval detail if relevant

**Displayed info:**
- artifact title
- note type
- canonical/draft
- last updated
- link/path handle

**Acceptance criteria:**
- users can navigate from operational objects to knowledge artifacts
- no standalone tab required for early usefulness

### Task 5.2. Add activity indicators for artifact creation
**Goal:** make knowledge generation visible in operations.

**Examples:**
- badge: “research artifact created”
- badge: “incident note created”
- badge: “daily log updated”

**Acceptance criteria:**
- artifact production is visible in operational context
- users gain confidence that work is being captured durably

## Epic 6. Retrieval-aware backend support

### Task 6.1. Implement typed retrieval APIs
**Goal:** generate focused context packets for agents and workflows.

**Suggested functions:**
- `getProjectContext(projectId)`
- `getIncidentContext(incidentId)`
- `getAgentOperatingContext(agentId)`
- `getApprovalContext(approvalId)`
- `getRecentOperationalMemory(system, dateRange)`

**Acceptance criteria:**
- retrieval is entity-aware and note-type-aware
- APIs favor canonical notes where available
- recent context and durable context can both be included

### Task 6.2. Add task-launch or workflow context assembly
**Goal:** supply relevant vault context before important work begins.

**Behavior:**
- assemble project note
- include recent incident if relevant
- include runbook/decision/learning notes where appropriate

**Acceptance criteria:**
- sensitive or recurring work can begin with better context
- system avoids naive full-vault retrieval

## Epic 7. Curation and documentation debt hooks

### Task 7.1. Implement artifact completeness checks
**Goal:** detect when meaningful work lacks durable knowledge artifacts.

**Checks might include:**
- active project missing project note
- incident missing postmortem/canonical artifact
- agent missing profile
- repeated procedure missing runbook
- repeated issue missing learning note

**Acceptance criteria:**
- system can surface documentation debt programmatically
- checks are available to future queue/review systems

### Task 7.2. Implement curation review queue hooks
**Goal:** support supervisor-led knowledge quality management.

**Behavior:**
- mark draft artifacts needing review
- flag promotion candidates
- surface stale canonical artifacts

**Acceptance criteria:**
- curation can become a structured workflow later
- supervisor agent neutrality is preserved

## Epic 8. Memory-bank visualization foundation

### Task 8.1. Expose artifact relationship graph data API
**Goal:** prepare useful graph/relationship visualizations later.

**Behavior:**
- return entity/artifact relationships
- differentiate projects, incidents, decisions, runbooks, research, agents
- support canonical vs draft distinction

**Acceptance criteria:**
- graph data is available without building final graph UI yet
- data model favors operationally meaningful relationships

### Task 8.2. Add simple relationship panels before full graph view
**Goal:** create useful visual understanding before fancy graphing.

**Examples:**
- connected artifacts on project page
- linked runbooks/learning notes on agent page
- related incidents/decisions on incident page

**Acceptance criteria:**
- memory-bank visualization starts with useful local relationship views
- full graph can come later on higher-quality data

## Epic 9. Future-compatible governance and access hooks

### Task 9.1. Support optional sensitivity metadata in artifacts
**Goal:** future-proof the note and DB models for restricted domains.

**Fields to support without forcing heavy use yet:**
- `visibility`
- `sensitivity`
- `allowed_agents`
- `domain`

**Acceptance criteria:**
- notes and link models can carry these fields
- system does not require them universally in v1

### Task 9.2. Add retrieval filter hooks for future policy controls
**Goal:** allow selective access later without redesign.

**Acceptance criteria:**
- retrieval pipeline can accept policy filters
- architecture does not assume every agent sees everything forever

---

# Part II. Recommended implementation order

## Sprint / Wave 1
- Task 1.1 Vault config
- Task 1.2 VaultService
- Task 1.3 FrontmatterService
- Task 1.4 TemplateService
- Task 1.5 path resolver
- Task 2.3 note-type validation

**Outcome:** backend can safely create and update structured notes.

## Sprint / Wave 2
- Task 2.1 CanonicalNoteResolver
- Task 2.2 KnowledgeArtifactService
- Task 2.4 lifecycle helpers
- Task 3.1 artifact linkage model
- Task 3.2 ArtifactLinkService
- Task 3.3 artifact audit events

**Outcome:** backend understands artifacts as linked operational objects.

## Sprint / Wave 3
- Task 4.1 daily-note hook
- Task 4.2 project integration
- Task 4.3 incident integration
- Task 4.4 agent integration
- Task 4.5 research integration
- Task 5.1 related artifacts in detail views
- Task 5.2 artifact activity indicators

**Outcome:** Mission Control workflows begin producing and exposing knowledge artifacts.

## Sprint / Wave 4
- Task 6.1 typed retrieval APIs
- Task 6.2 context assembly for task launch/workflows
- Task 7.1 artifact completeness checks
- Task 7.2 curation review queue hooks

**Outcome:** the vault begins actively improving execution quality and knowledge hygiene.

## Sprint / Wave 5
- Task 8.1 relationship graph data API
- Task 8.2 relationship panels
- Task 9.1 sensitivity metadata support
- Task 9.2 retrieval policy hooks

**Outcome:** system is ready for memory-bank visualization and future governance hardening.

---

# Part III. Codex-ready implementation brief

## Objective
Implement the first production-ready integration between Mission Control backend workflows and an Obsidian-compatible markdown vault used as the institutional memory layer for the OpenClaw ecosystem.

## Required outcome
Mission Control should be able to create, update, link, and retrieve structured vault artifacts related to operational entities such as tasks, projects, agents, incidents, and research outputs, without introducing a separate heavy vault UI and without making the system Celine-specific.

## Key product expectations
- backend-first implementation
- markdown + frontmatter as durable knowledge source of truth
- linked artifact model in Mission Control DB
- canonical note handling
- auditability of artifact writes
- minimal but useful UI exposure through existing detail surfaces
- retrieval hooks for future context-aware execution
- future readiness for memory-bank visualization and selective access

## Key engineering expectations
- strongly typed services where practical
- path-safe filesystem operations
- deterministic note routing and filename generation
- reusable template-driven note creation
- supervisor-agent-neutral naming and abstractions
- clean separation between file storage and DB linkage/index state

## Suggested modules/services to add
- `VaultService`
- `FrontmatterService`
- `TemplateService`
- `CanonicalNoteResolver`
- `KnowledgeArtifactService`
- `ArtifactLinkService`
- retrieval/context assembly utilities

## Initial supported note types
At minimum support:
- daily
- project
- incident
- research
- agent

Design with easy extension to:
- decision
- runbook
- learning
- review
- system
- map

## Suggested first backend behaviors
- append structured entries to daily notes
- create or update project notes on project lifecycle changes
- create incident notes on incident creation
- create/update agent profile notes on agent creation/change
- create research notes from research workflows
- link each created artifact back to its operational entity in DB

## Suggested first UI behaviors
- show related artifacts on existing detail views
- show lightweight artifact creation indicators in activity/log surfaces
- avoid building a major dedicated vault tab in the MVP

## Quality gates
Implementation should be considered successful only if:
- artifact writes are reliable and auditable
- canonical duplicates are controlled
- linked artifact retrieval works by operational entity
- file path safety is enforced
- note schemas are validated
- design remains supervisor-neutral

## Pitfalls to avoid
- hardcoding Celine identity into architecture
- treating the vault as a detached feature
- dumping raw unstructured content into core folders
- relying only on filename heuristics with no DB linkage
- building graph UI before artifact relationships are meaningful
- trying to implement full permissions/semantic search too early

## Open implementation decisions for the coding agent to resolve carefully
- exact DB schema for artifact links
- how to store cached metadata vs file truth
- exact place in backend architecture for vault services
- whether frontmatter parsing uses existing library vs internal helper
- whether note body sections should be standardized via templates only or supplemented by code-side generators

## Definition of done for MVP
The MVP is done when:
1. Mission Control backend can create and update vault artifacts safely
2. tasks/projects/incidents/agents/research can link to artifacts in DB
3. core operational workflows start producing durable notes automatically
4. existing detail views can surface linked artifacts
5. retrieval utilities exist for future context packets
6. code and product language remain supervisor-neutral
7. the system is ready for later curation, graphing, and restricted retrieval without redesign

---

# Part IV. Final recommendations to implementation agents

## Recommendation 1
Treat the vault integration as product infrastructure, not documentation glue.

## Recommendation 2
Bias toward durable backend primitives first, UI second.

## Recommendation 3
Build local relationship views before a global graph.

## Recommendation 4
Keep write paths strict and typed.

## Recommendation 5
Preserve clean naming so the system can outgrow any one supervisor identity.

## Recommendation 6
Favor a small high-quality MVP over a wide but fragile feature set.

## Bottom line

If implemented correctly, this work will create the first real bridge between Mission Control operations and institutional agent memory.

That bridge is what allows:
- fewer repeated mistakes
- stronger context continuity
- better supervisor oversight
- durable project and incident memory
- future memory-bank visualization
- future retrieval-aware execution quality improvements

That is the engineering objective this document is meant to support.
