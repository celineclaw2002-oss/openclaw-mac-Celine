# Codex Handoff Package: Obsidian Vault Integration for Mission Control

## Purpose

This document is the implementation handoff prompt/package for Codex.

It is meant to convert the planning work into an actionable build brief that can be executed inside the Mission Control repository.

It should be used together with the planning documents, but it is intentionally written as the most direct implementation-facing instruction set.

## Required planning context

Codex should treat the following three documents as primary context:

1. **Context / specification document**
   - Obsidian vault blueprint
   - integration architecture
   - templates and schema

2. **Rollout plan document**
   - phased product/backend integration strategy
   - how the vault should connect to Mission Control logic

3. **Engineering execution document**
   - sequenced backlog
   - implementation tracks
   - MVP and acceptance criteria

This handoff prompt is not a replacement for those docs.
It is the execution wrapper around them.

## Mission

Implement the first production-ready integration between Mission Control and an Obsidian-native vault used as the institutional memory layer for the OpenClaw ecosystem.

The implementation should build on the current Mission Control memory infrastructure, but the durable knowledge layer should be explicitly designed around Obsidian-compatible vault conventions:
- markdown files
- YAML frontmatter
- folder conventions
- templates
- wikilinks / graphable relationships
- durable canonical notes

Mission Control should integrate with this vault as an operational system, not merely display it as an isolated documentation browser.

## Critical alignment points

### 1. Build on existing memory infrastructure
Do not throw away the current memory system.

The repository already contains:
- memory filesystem APIs
- memory path safety helpers
- memory utilities
- memory full-text search
- memory browser UI
- memory graph UI

Those should be used as foundations where appropriate.

### 2. The vault must still be Obsidian-native
Even though we build on existing Mission Control memory infrastructure, the actual durable knowledge substrate should be an Obsidian-compatible vault.

This means:
- markdown as the source-of-truth format
- frontmatter-driven metadata
- note templates
- folder structure compatible with the agreed blueprint
- files readable and editable directly in Obsidian
- note relationships compatible with Obsidian link/graph workflows

### 3. Do not make the system Celine-specific
The system should be designed around a general supervisor agent / chief-of-staff role, not around a permanently fixed assistant identity.

Avoid naming or architecture choices that assume Celine is always the supervisor.

### 4. Do not start with a standalone vault tab
The vault should integrate through existing Mission Control backend logic and existing entity surfaces.

A dedicated top-level vault tab is not required in the first implementation wave.

### 5. Backend-first
Prioritize backend services, linkage, workflow hooks, and artifact generation before large new UI surfaces.

### 6. Preserve layer separation
- Obsidian vault = institutional memory / knowledge substrate
- Mission Control = orchestration / supervision / approvals / operations
- OpenClaw agents = execution actors and knowledge producers/consumers

## Primary product goal

Mission Control should become able to:
- create and update Obsidian-compatible vault artifacts
- associate those artifacts with operational entities
- surface them in existing relevant product surfaces
- retrieve them as structured context later
- support future promotion/curation/governance flows

## Repo-specific orientation

Repository inspected: `celine-mission-control-fork`

Important current foundations already present:
- `src/app/api/memory/route.ts`
- `src/lib/memory-path.ts`
- `src/lib/memory-utils.ts`
- `src/lib/memory-search.ts`
- `src/components/panels/memory-browser-panel.tsx`
- `src/components/panels/memory-graph.tsx`
- `src/lib/db.ts`
- `src/lib/schema.sql`
- `src/lib/task-create.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/projects/route.ts`
- startup preload in `src/app/[[...panel]]/page.tsx`

Implication:
this implementation should extend and formalize existing memory capabilities rather than bolt on a disconnected new subsystem.

## High-level implementation strategy

Create a structured artifact layer on top of the current memory/vault foundations.

Suggested new backend services:
- `VaultService`
- `FrontmatterService`
- `TemplateService`
- `CanonicalNoteResolver`
- `KnowledgeArtifactService`
- `ArtifactLinkService`

These services should support Obsidian-native artifacts while leveraging existing memory safety and indexing infrastructure where practical.

## Deliverable scope for the first implementation wave

The first implementation wave should include:

### A. Vault configuration and routing
- configurable vault root
- configurable templates path
- safe resolution of vault paths
- deterministic note routing by note type
- Obsidian-compatible folder structure support

### B. Structured artifact services
- markdown note creation from templates
- frontmatter parsing/updating
- canonical note resolution
- append-to-daily-note support
- create/update support for core note families

### C. DB linkage between operational entities and artifacts
Mission Control DB should be able to link artifacts to:
- tasks
- projects
- agents
- incidents
- research outputs
- approvals later if feasible

### D. First workflow integrations
Hook vault artifact logic into existing backend flows for:
- task-related durable logging
- project note creation/update
- incident artifact creation
- agent profile artifact creation/update
- research artifact creation

### E. Minimal UI surfacing in existing product surfaces
Examples:
- related artifacts on task/project/agent/incident detail views
- artifact creation indicators in activity-related surfaces

### F. Retrieval-ready foundation
Do not build full semantic retrieval yet, but structure the system so typed retrieval/context packets can be added cleanly afterward.

## Strong anti-goals for this pass

Do **not** prioritize the following in this implementation wave:
- a fully separate vault product area
- a giant graph explorer first
- a full permissions engine
- broad unrestricted semantic search across everything
- autonomous curation logic that rewrites large parts of the vault
- DB as the primary source of durable knowledge content

## Required architectural constraints

### Constraint 1. Markdown is durable truth
The vault files are the source of truth for knowledge content.

The DB may cache metadata and relationships, but should not replace markdown as the durable content layer.

### Constraint 2. Canonical note discipline
Prefer one canonical durable note per entity.

At minimum support canonical logic for:
- projects
- agents
- incidents
- decisions later

### Constraint 3. Safe filesystem behavior
Use path-safe write logic and never allow vault path escape.

### Constraint 4. Auditability
Artifact creation and updates should be auditable in Mission Control activity/log systems.

### Constraint 5. Supervisor neutrality
Code and product language should use role-based terms like:
- supervisor
- knowledge artifact
- vault artifact
- institutional memory

Avoid assistant-name-specific semantics.

## Specific engineering tasks Codex should focus on first

### 1. Add vault configuration support
Investigate the current config system and add support for vault-related settings.

Suggested concepts:
- `vaultEnabled`
- `vaultRoot`
- `vaultTemplatesPath`
- `vaultWriteMode`
- `vaultIndexMode`

### 2. Add core vault services
Implement these in `src/lib/`:
- `vault-service.ts`
- `frontmatter-service.ts`
- `template-service.ts`
- `canonical-note-resolver.ts`
- `knowledge-artifact-service.ts`
- `artifact-link-service.ts`

### 3. Extend schema/migrations for artifact linkage
Add DB support for linking artifacts to operational entities.

Likely work areas:
- `src/lib/schema.sql`
- `src/lib/migrations.ts`
- `src/lib/db.ts`

### 4. Hook project and task flows first
Use the cleanest existing backend seams first.

Best starting points:
- `src/lib/task-create.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/projects/route.ts`

### 5. Reuse existing memory APIs thoughtfully
Avoid duplicating path safety, indexing, or file access logic where the current memory system already provides useful primitives.

### 6. Surface artifacts in existing UI rather than inventing new large UI
Use current detail surfaces and activity indicators.

## Suggested first-wave note families to support
At minimum support these artifact types in code:
- daily
- project
- incident
- research
- agent

Design for later extension to:
- decision
- runbook
- learning
- review
- system
- map

## Suggested implementation order

### Wave 1
- vault config support
- vault service
- frontmatter service
- template service
- path/filename resolver
- note-type validation

### Wave 2
- canonical note resolver
- knowledge artifact service
- artifact linkage schema
- artifact link service
- audit events

### Wave 3
- daily-note append hook
- project artifact integration
- incident artifact integration
- agent artifact integration
- research artifact integration
- minimal related-artifact UI exposure

### Wave 4
- typed retrieval/context foundation
- artifact completeness checks
- curation hook stubs
- memory-bank graph data foundation if time permits

## Suggested concrete file targets

### Likely files to add
- `src/lib/vault-service.ts`
- `src/lib/frontmatter-service.ts`
- `src/lib/template-service.ts`
- `src/lib/canonical-note-resolver.ts`
- `src/lib/knowledge-artifact-service.ts`
- `src/lib/artifact-link-service.ts`

### Likely files to modify
- `src/lib/config.ts`
- `src/lib/schema.sql`
- `src/lib/migrations.ts`
- `src/lib/db.ts`
- `src/app/api/memory/route.ts`
- `src/lib/task-create.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/projects/route.ts`
- relevant entity/detail panel files for related artifact surfacing

### Likely UI surfaces to extend later in MVP
- task detail surface
- project detail surface
- agent detail surface
- incident-related surface if present
- memory browser / memory graph only where it meaningfully helps

## Quality expectations

The implementation should be considered strong only if:
- it is Obsidian-compatible in storage format and note structure
- it uses backend services rather than ad hoc route logic
- artifact linkage is durable and queryable
- the system remains supervisor-neutral
- it does not introduce unsafe filesystem behavior
- it does not force a new top-level UI area prematurely
- it does not duplicate existing memory primitives unnecessarily

## Pitfalls to avoid

- treating Obsidian support as a cosmetic export format instead of the true knowledge substrate
- treating current memory tooling as something to discard instead of extend
- hardcoding Celine identity into artifact architecture
- storing all knowledge primarily in DB tables instead of vault markdown
- building memory-bank graph UI before artifact data quality is real
- creating duplicate canonical notes because entity linkage was ignored
- making v1 depend on full selective access rules

## Definition of done for the first pass

The first pass is successful when:
1. Mission Control can safely create and update Obsidian-compatible vault artifacts
2. core operational entities can link to those artifacts in DB
3. task/project/agent/incident/research workflows begin producing durable structured notes
4. existing product surfaces can show related artifacts in lightweight ways
5. the implementation is supervisor-neutral, backend-first, and compatible with future retrieval and visualization work

## Final instruction to Codex

Do not respond only with a high-level plan.

Inspect the current repository structure and begin implementing the first-wave backend foundations directly.

Prefer incremental, production-sensible changes that fit the current Mission Control architecture.

If tradeoffs arise, preserve:
- Obsidian-native durable knowledge format
- reuse of existing memory infrastructure
- backend-first integration
- supervisor neutrality
- future extensibility for retrieval, curation, and memory visualization

## Suggested user message to accompany this handoff

You are implementing the first production-ready Obsidian vault integration for Mission Control.

Please use the attached planning documents as context and treat this handoff package as the execution brief.

Important constraints:
- build on the current memory infrastructure rather than replacing it
- the durable knowledge layer must still be Obsidian-native
- do not make the implementation Celine-specific
- do not start with a standalone vault tab
- prioritize backend services, artifact linkage, and task/project/incident/agent/research integrations first

Please inspect the current repo and begin implementing the first-wave foundation directly.
