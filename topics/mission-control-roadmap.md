# Mission Control Roadmap

## Summary
This roadmap translates Can's clarified Mission Control vision into a practical build order. The main priority is not maximum features immediately, but a trustworthy operating foundation: clear approval paths, strong supervision, agent-to-agent and agent-to-Celine information flow, safe execution semantics, migration-friendly architecture, and a structure that can scale after the Mac mini arrives.

## Decisions
- Foundation and governance come before broad function expansion.
- Mission Control should first become trustworthy and operationally coherent, then become wider.
- Pre-Mac-mini work should prove the system; post-migration work should scale the system.
- The next layers after Workshop should support real supervision, approval, reporting, and specialist-agent integration.
- The first subordinate agent created before Mac mini migration should likely be a narrowly scoped coding specialist if feasible; otherwise a PA agent, and either way should be treated as a deliberate pilot.
- Research and cybersecurity are strategic backbone functions and should shape later architecture even if they are not the very first live specialist agents.
- Future AaaS potential should influence portability and reuse decisions softly, without becoming the current delivery goal.

## Work Completed
- Clarified the operating blueprint for Mission Control.
- Clarified intended autonomy boundaries and escalation behavior.
- Clarified reporting expectations and the desired briefing style for Can.
- Clarified the likely near-term and longer-term agent roster.
- Clarified that trust depends especially on simulation/backtesting, rollback capability, and safety-first change handling.

## Relevant Context
- Product implementation repo:
  - `projects/celine-mission-control`
- Product state summaries:
  - `topics/mission-control-workshop.md`
  - `topics/mission-control-workshop-spec.md`
  - `topics/mission-control-operating-blueprint.md`
- Durable memory references:
  - `memory/2026-04-09-mission-control.md`
  - `memory/2026-04-09.md`

## Open Questions
- Whether the first subordinate agent should be Mission Control builder or PA agent.
- How much approval/risk logic should be hard-coded first versus made configurable from the UI.
- Which business opportunity lane should be the first candidate for future monetization experiments.

## Next Steps
1. **Approval and governance layer**
   - define explicit approval classes by action category
   - model autonomous vs Celine-approved vs Can-approved behavior in a way that can later surface in Mission Control
   - define escalation rules for uncertainty, safety concerns, and major course changes
   - model emergency containment authority for narrowly scoped reversible protective actions

2. **Reporting and briefing layer**
   - define what every agent must report to Celine
   - define what gets surfaced to Can immediately versus in summaries versus log-only storage
   - design a future morning briefing structure around:
     - relevant research
     - trading summary
     - urgent issues
     - decisions needing input

3. **Specialist-agent integration layer**
   - choose and create the first real subordinate agent before Mac mini migration
   - likely preference: narrowly scoped Mission Control coding specialist
   - fallback: PA agent if coding specialist is not yet operationally clean
   - treat the first subordinate agent explicitly as a supervision-and-flow pilot, not just a feature generator

4. **Workshop and execution hardening**
   - continue moving queue/progression logic toward backend source-of-truth
   - add scenario tests or simulation fixtures for queue behavior, escalation, review, and archive transitions
   - keep Workshop aligned with real agent behavior, not arbitrary UI state

5. **Trust and safety tooling**
   - add stronger audit trails where useful
   - plan rollback paths for meaningful changes
   - define simulation/backtest requirements for high-impact agents, especially trading and cybersecurity-sensitive changes

6. **Migration readiness**
   - keep setup assumptions portable to the Mac mini
   - document local review, agent setup conventions, and architecture decisions clearly
   - prefer durable config conventions over machine-specific shortcuts

7. **Future expansion after foundations**
   - research agent as continuous intelligence engine
   - cybersecurity auditor as continuous plus change-triggered defense layer
   - business manager as autonomous venture builder and future overseer of subordinate business-lane agents
   - trading agent with strict risk controls and strong simulation expectations
   - intelligence area modeled as an actionable inbox rather than a passive feed
