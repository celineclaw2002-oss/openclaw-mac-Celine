# Mission Control Operating Blueprint

## Summary
Mission Control should become the operating layer for Can's agent ecosystem. It is not the business itself, but the governed operating environment that coordinates control, supervision, approval routing, and decision flow across specialist agents. Celine is the chief of staff, logic gate, and escalation layer. The near-term goal is to prove the system: make the logic, reporting flow, approval structure, execution model, and one-subordinate-agent supervision path clean enough that the Mac mini migration becomes a scale-up step rather than a redesign.

## Decisions
- Mission Control remains the product name, but its operating definition is a governed operating environment.
- Mission Control should be designed as a blend of command center, operating system, and chief-of-staff dashboard.
- Celine is the primary coordinator, logic checker, and escalation layer between agents and Can.
- Cyber safety and financial safety are hard constraints across the whole system.
- Agents should be given meaningful autonomy, but not autonomy that can silently endanger the system, finances, or long-term vision.
- Significant changes should first be developed or tested in a safe environment before touching live systems.
- Uncertain agents should escalate to Celine first; Celine decides whether Can should be pulled in.
- Pre-Mac-mini priority is to prove the system, not maximize features.
- Post-migration priority is to scale the system once logic and governance are trustworthy.
- The first subordinate agent before migration should be treated as a deliberate pilot program used to validate supervision and flow, not as the final perfected subordinate-agent model.
- The long-term host is the Mac mini, but design decisions made now should already assume future always-on operation and later growth.
- Mission Control should support specialist agents rather than trying to collapse all functions into one assistant.
- Future AaaS potential should be treated as a soft architecture principle for portability and reuse, not as the current mission.

## Work Completed
- Clarified the intended role of Mission Control as the operating and supervision layer for the broader agent system.
- Clarified the intended role of Celine as chief of staff rather than just a chat assistant.
- Identified the intended early specialist-agent map:
  - Celine
  - Personal Assistant agent
  - Mission Control coding specialist (preferred first subordinate agent if feasible)
  - Trading agent
  - Business manager / autonomous venture builder and overseer
  - Research agent
  - Cybersecurity auditor
  - likely later: Aegis-style specialized reviewer
- Defined the initial governance model:
  - Trading execution can be autonomous only within strict future risk constraints, while strategy changes should follow a stricter approval path.
  - Revenue/opportunity execution lanes can become comparatively autonomous within guardrails.
  - Coding and configuration changes should be Celine-approved.
  - New automations should be Can-approved.
  - Messaging autonomy depends on context, with most business-facing outbound communication initially routed through Celine and personal or career-sensitive communication requiring Can approval.
  - New external accounts, paid signups, and direct non-trading spending should surface to Can.
  - Emergency containment authority should exist for narrowly scoped, reversible protective actions, with immediate escalation to Celine.
- Defined the intended reporting model:
  - agents report to Celine on task completion, blockers, uncertainty, milestone points, and major findings
  - Celine routes to Can only when something is urgent, strategically important, risky, milestone-level, or decision-blocking
  - reporting should use three tiers: interrupt now, next briefing, and log only
  - Can's ideal briefing includes relevant research findings, trading summary, urgent items, and decisions needing input
- Clarified product implications for Mission Control itself:
  - top fast actions should be Launch tasks, Redirect, and Approve
  - agent creation and management should live inside Mission Control
  - research/intelligence should eventually have its own visible area, likely shaped like an actionable intelligence inbox
- Identified trust-building mechanisms as especially important:
  - simulations and backtests
  - rollback capability
  - strong auditability and approval visibility
- Clarified pre/post migration discipline:
  - pre-Mac-mini = prove the system
  - post-Mac-mini = scale the system

## Relevant Context
- Existing Mission Control product work and Workshop execution-loop work live in:
  - `topics/mission-control-workshop.md`
  - `topics/mission-control-workshop-spec.md`
  - `projects/celine-mission-control`
- Existing durable memory for Mission Control direction already exists in:
  - `memory/2026-04-09-mission-control.md`
  - `memory/2026-04-09.md`
- Current Mission Control product shape already trends toward:
  - Overview
  - Agents
  - Workshop
  - Scheduler
  - Usage
  - Chat
  - Activity
  - Intelligence

## Open Questions
- Whether the first real subordinate agent before Mac mini migration should be the Mission Control coding specialist or, if current setup limits make that weak, a PA agent pilot instead.
- How the research agent should technically distribute findings to other agents without creating noisy or unsafe feedback loops.
- How to represent approval ladders, risk classes, and emergency containment rules explicitly in the UI and backend.
- Which revenue/opportunity lanes should be explored first once the foundations are stable.
- What exact simulation and rollback workflows should exist before trading or high-impact automations are trusted.
- How the future Intelligence area should be modeled so it is actionable and inbox-like rather than just another feed.

## Next Steps
1. Translate this tightened blueprint into concrete Mission Control implementation work.
2. Define a first-pass approval matrix by category: autonomous, Celine-approved, Can-approved, plus emergency containment handling.
3. Decide which single specialist agent to spin up first before Mac mini migration and treat it as a pilot program.
4. Continue Mission Control implementation with logic/governance support, not just UI expansion.
5. Keep all architectural decisions migration-friendly, resumable, and softly compatible with future AaaS possibilities without optimizing for that prematurely.
