## Part 2. Integration Architecture

This section defines how the Obsidian vault should integrate with OpenClaw agents and Mission Control.

The goal is to make the vault a durable, structured, useful knowledge substrate without turning it into a noisy dumping ground or confusing it with the operational control plane.

## Integration principles

### 1. Clear layer separation
The system should preserve clear boundaries:
- Obsidian vault = knowledge, memory, learning, documentation, retrieval substrate
- Mission Control = operations, orchestration, approvals, agent supervision, runtime visibility, task routing
- OpenClaw agents = producers and consumers of knowledge, execution actors, and upskilling participants

Obsidian should not become the live runtime control plane.
Mission Control should not become the only durable memory layer.

### 2. Write discipline over raw dumping
The vault should reward structured writing, not indiscriminate dumping.

Integration should make it easy for agents to:
- append meaningful operational logs to daily notes
- update canonical project and system notes
- create incident, decision, research, and runbook notes when warranted
- distill durable knowledge from raw work

Integration should make it harder for agents to:
- create duplicate notes
- spam low-value fragments into core folders
- store important knowledge only inside ephemeral chats

### 3. Canonical note ownership
Each durable entity should have one primary note.

Examples:
- one project = one canonical project note
- one agent = one canonical agent profile
- one incident = one canonical incident note
- one decision = one canonical decision note
- one runbook = one canonical procedure note

Agents should preferentially update canonical notes rather than create sibling duplicates.

### 4. Retrieval should be context-aware
Agents should not search the entire vault blindly on every task.

Retrieval should be shaped by:
- task type
- system or project context
- active agent role
- allowed note types
- recency and relevance

This is important for quality, token efficiency, and future governance.

### 5. Curation is part of the system
Not everything written by agents should be treated as equally durable.

The knowledge system should recognize at least three levels of persistence:
- raw capture
- working knowledge
- canonical institutional knowledge

That distinction is critical.

## Core integration model

The cleanest model is a three-layer loop:

1. **Execution layer**
   - OpenClaw agents perform work
   - Mission Control supervises work, routes tasks, approvals, escalations, and reporting

2. **Knowledge layer**
   - agents write outputs, findings, incidents, and distilled learnings into the Obsidian vault
   - the vault stores durable memory and reusable knowledge

3. **Retrieval layer**
   - future agent work queries relevant notes from the vault
   - those notes improve execution quality, consistency, and memory continuity

So the loop becomes:

**work -> write -> organize -> retrieve -> improve future work**

That is the central architectural loop.

## Integration responsibilities by component

### A. OpenClaw agents
Agents should interact with the vault in four modes.

#### 1. Read mode
Agents retrieve context before or during meaningful work.

Typical reads:
- project context
- runbooks
- past incidents
- previous decisions
- research notes
- learning notes / best practices
- relevant daily notes for recent state

Agents should read before:
- making important changes
- repeating a process
- diagnosing a familiar issue
- generating recommendations
- escalating or reporting on a situation

#### 2. Write mode
Agents should write durable outcomes into the vault.

Typical writes:
- daily note updates
- project status updates
- new research notes
- new incident notes
- updated runbooks
- learning notes after meaningful lessons
- decision drafts when recommendations change direction

#### 3. Distill mode
Agents should convert raw work into stable knowledge.

Examples:
- daily debugging notes -> incident postmortem
- repeated operational steps -> runbook
- research thread -> structured research note + recommendation
- recurring mistakes -> learning note / failure pattern

This is one of the most important capabilities in the whole system.

#### 4. Retrieve-for-upskilling mode
Agents should use the vault not just for memory, but for behavioral improvement.

Examples:
- reading best practices before doing sensitive repo work
- reading prior failure patterns before changing configs
- reading agent governance notes before suggesting autonomy changes
- reading previous incidents before diagnosing similar regressions

This is where the vault becomes a training substrate.

### B. Mission Control
Mission Control should not store primary knowledge itself when the knowledge belongs in the vault.

Instead, Mission Control should act as:
- orchestrator
- index entrypoint
- review surface
- governance and approval layer
- activity monitor
- triage layer

Mission Control responsibilities relative to the vault:
- route tasks that require knowledge retrieval
- show linked knowledge objects for tasks, agents, incidents, and projects
- display whether a task produced a vault artifact
- surface missing documentation or missing postmortems
- trigger or schedule curation workflows
- enforce future policy rules around note creation and knowledge visibility

Mission Control should eventually understand vault artifacts as first-class related objects.

Examples:
- a task links to a project note and incident note
- an agent page links to its canonical Obsidian profile
- an approval request links to relevant runbooks and past incidents
- an incident in Mission Control links to its vault postmortem

### C. Obsidian vault
The vault should act as:
- durable storage for structured knowledge
- authoring interface for human review and editing
- graph of linked institutional memory
- retrieval substrate for agents
- upskilling substrate for future behavior

The vault should not be responsible for:
- live task queue management
- approval workflows themselves
- runtime orchestration
- real-time agent supervision

## Knowledge lifecycle architecture

This is the most important lifecycle model.

### Stage 1. Raw capture
Source examples:
- chat output
- temporary agent findings
- copied logs
- scratch analysis
- heartbeat summaries
- debugging notes

Destination examples:
- `01 Inbox/`
- `02 Daily/`
- `13 Assets/Logs/`

Characteristics:
- fast
- incomplete
- noisy
- not yet canonical

### Stage 2. Working knowledge
Source examples:
- draft research notes
- active project updates
- early incident notes
- draft runbooks
- provisional architecture notes

Destination examples:
- `03 Projects/`
- `04 Mission Control/`
- `09 Incidents/Open/`
- `10 Research/`

Characteristics:
- structured
- useful
- still evolving
- may not be final

### Stage 3. Canonical knowledge
Source examples:
- stable project summary
- final incident postmortem
- approved decision note
- validated runbook
- best-practice learning note

Destination examples:
- `07 Decisions/`
- `08 Runbooks/`
- `11 Learning/`
- stable notes in `04 Mission Control/` or `06 Knowledge/`

Characteristics:
- durable
- high trust
- reusable
- intended for repeated retrieval

### Stage 4. Archived knowledge
Source examples:
- retired systems
- outdated procedures
- superseded project notes
- closed investigations with no ongoing value except history

Destination:
- `99 Archive/`

The system should preserve lifecycle movement, not treat all notes as equal forever.

## Recommended write patterns

### Pattern 1. Event logging
When agents complete notable work, they should append a concise structured record to the relevant daily note.

Good for:
- work logs
- handoffs
- recent context
- debugging chronology

### Pattern 2. Canonical note update
When an agent learns something that changes the state of a durable entity, it should update the canonical note.

Examples:
- project status changed
- incident root cause identified
- agent operating profile changed
- roadmap milestone adjusted

### Pattern 3. New artifact creation
When a new durable entity appears, create a structured note.

Examples:
- new incident
- new decision
- new runbook
- new research dossier
- new learning note

### Pattern 4. Distillation pass
After meaningful work, a designated agent or curation workflow should distill raw material into higher-quality notes.

This is where institutional memory gets stronger over time.

## Proposed roles in the integration architecture

### 1. Producer agents
These generate raw and structured knowledge during normal work.

Examples:
- research agent
- coding specialist
- PA agent
- cybersecurity auditor
- trading support agents later

### 2. Curator role
A curator role should eventually exist, even if initially that role is handled by Celine.

Curator responsibilities:
- resolve duplicate notes
- distill daily notes into stable knowledge
- convert repeated procedures into runbooks
- convert failures into learning notes
- keep project notes current
- ensure important work produces durable artifacts

In the short term, Celine should likely be the curator and gatekeeper.

### 3. Reviewer / approver
Can remains the human reviewer and strategic decision-maker.

Mission Control and Celine should determine what needs Can's approval versus what can simply be logged, curated, or operationally routed.

## Retrieval architecture

The retrieval model should be selective and typed.

### Retrieval inputs
At query time, the system should consider:
- agent identity
- task type
- relevant systems
- relevant projects
- relevant note types
- time range if recent context matters
- optional future visibility filters

### Recommended retrieval tiers

#### Tier 1. Immediate task context
Retrieve:
- linked project note
- linked system note
- linked runbooks
- latest incident if relevant
- recent daily notes tied to the task

Use when:
- active execution
- debugging
- task continuation

#### Tier 2. Institutional memory context
Retrieve:
- related decision notes
- architecture notes
- prior research
- learning notes / best practices

Use when:
- planning
- recommending
- changing process
- handling repeated issues

#### Tier 3. Governance and risk context
Retrieve:
- approval matrix
- policy notes
- risk and escalation notes
- sensitive prior incidents

Use when:
- autonomy questions arise
- meaningful changes are proposed
- trading / security / external messaging actions are involved

### Retrieval constraints
The system should avoid:
- massive full-vault retrieval
- mixing low-quality raw notes with canonical notes without distinction
- ignoring recency when recent state matters
- ignoring canonical notes when durable truth exists

## Recommended indexing model

Even if we do not build it immediately, the vault architecture should assume three future indexing layers.

### 1. Path and metadata index
Basic structured lookup by:
- folder
- note type
- tags
- system
- project
- agent
- status

### 2. Link graph index
Used to understand note relationships.

Examples:
- incident linked to project
- decision linked to system
- agent linked to runbooks and governance notes

### 3. Semantic retrieval index
Used later for meaning-based search across note bodies.

This should be applied selectively, especially once sensitive domains appear.

## Governance architecture for vault interaction

### Approval principle
Most vault writes should not need human approval.

But some knowledge actions should trigger review or higher scrutiny.

Examples:
- editing high-trust canonical governance notes
- changing agent authority descriptions
- changing trading-related guidance later
- modifying safety runbooks
- overwriting incident conclusions

### Write classes
A useful future classification model:

#### Class A, low-risk writes
- append to daily note
- add research draft
- create inbox note
- attach logs

Can be agent-autonomous.

#### Class B, medium-risk writes
- update project status
- create incident draft
- update non-sensitive runbook
- create learning note

Can be Celine-reviewed or agent-autonomous with audit trail, depending on maturity.

#### Class C, high-risk writes
- change governance doctrine
- alter approval rules
- change sensitive system guidance
- modify restricted knowledge areas later

Should be Celine-approved and sometimes Can-approved.

This mirrors the broader Mission Control governance model well.

## Access control future-compatibility

As agreed, selective access should not define the whole v1 design.

But the integration architecture should support later introduction of restricted retrieval.

Recommended future-compatible controls:
- optional note metadata like `visibility`, `domain`, `allowed_agents`, `sensitivity`
- retrieval filtering based on agent identity
- exclusion of sensitive notes from broad semantic search pools
- domain-aware indexes later if trading or security content requires stronger isolation

The important point is this:
we should design so selective access can be layered in later without restructuring the vault.

## Mission Control UI integration ideas

Mission Control should eventually expose vault context in practical ways.

### 1. Linked knowledge panel
For tasks, incidents, projects, and agents, show:
- related notes
- most recent updates
- associated runbooks
- linked incidents
- related decisions

### 2. Artifact completion tracking
A task should be able to show whether it produced:
- a daily log update
- project note update
- incident note
- research note
- runbook
- learning artifact

### 3. Documentation debt surfacing
Mission Control should highlight when:
- repeated issues lack an incident note
- repeated processes lack a runbook
- projects have stale summaries
- agents lack canonical profiles
- important findings exist only in chats

### 4. Approval context enrichment
Approval requests should surface:
- relevant runbooks
- similar prior incidents
- prior decisions
- known risks

This makes approvals more informed and safer.

## Recommended implementation phases for the integration itself

### Phase 1. Manual-compatible structured writing
- create the vault structure
- define note types and metadata
- allow agents to read and write markdown files directly
- start with daily, projects, incidents, research, runbooks, decisions, learning

### Phase 2. Canonical note discipline
- define canonical note lookup rules
- teach agents when to update vs create
- establish curation workflows
- add lightweight dashboards / indexes inside the vault

### Phase 3. Mission Control linking
- surface related vault artifacts in Mission Control
- link tasks, projects, incidents, and agents to notes
- track whether durable artifacts were created

### Phase 4. Retrieval enrichment
- add structured retrieval pipelines
- use metadata and links for filtered retrieval
- later add semantic search and ranking

### Phase 5. Governance and access controls
- introduce restricted retrieval where needed
- tune write permissions by note class
- add stronger review rules for sensitive domains

## Recommended near-term operating model

Given the current stage of the system, the most practical near-term model is:

- agents can append to daily notes and create drafts in structured folders
- Celine acts as curator and gatekeeper for higher-trust notes
- Mission Control remains the supervision and routing layer
- major findings should be distilled into projects, incidents, decisions, runbooks, or learning notes
- the vault should become the durable memory layer for all meaningful OpenClaw work

## Bottom line

The integration architecture should create a disciplined loop between work, memory, learning, and future execution quality.

The best framing is:
- Mission Control runs the system
- OpenClaw agents do the work
- Obsidian stores the institutional brain
- Celine governs the flow between them

If built well, this architecture will reduce repeated mistakes, improve context continuity, strengthen agent upskilling, and make the whole ecosystem more coherent as it scales.
