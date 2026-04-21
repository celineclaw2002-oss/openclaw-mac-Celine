# Mission Control

## Summary
Evaluation and selection of a multifunction Mission Control system for Celine and future specialist agents.

## Decisions
- Generic CRM or e-commerce style dashboards are not the right fit.
- `builderz-labs/mission-control` currently looks like the closest conceptual fit.
- Because of prior breakage in an earlier OpenClaw environment, Builderz must be evaluated with strong isolation and explicit safety controls.
- Before any install, create a safety harness consisting of an evaluation checklist, a backup and diff procedure, and a forbidden-actions list.

## Work Completed
- Researched multiple Mission Control candidates and alternatives.
- Identified Builderz as the strongest conceptual fit despite elevated operational risk.
- Identified safer but less ideal alternatives such as Shannon, AgentField, Exosphere, Scarf, SuperAGI, and AIOS.
- Documented the need for a controlled evaluation process before touching the live OpenClaw environment.
- Created a full Builderz safety harness: checklist, backup procedure, diff tooling, forbidden actions, and runtime health checks.
- Completed a first isolated Builderz app-only test successfully.
- Wrote a governed-fork customization plan for Builderz.
- Drafted the Mission Control v1 blueprint.

## Relevant Context
- Previous attempt with Builderz appears to have broken parts of OpenClaw, including terminal and image handling, possibly after a repair or doctor-style action.
- Current OpenClaw environment is working and should not be risked casually.
- Long-term Mission Control should include dashboard, agents, cron, workshop/kanban, API usage, intelligence, and chat.

## Open Questions
- Whether Builderz should ever be tested against live OpenClaw state, or only against copies and isolated sandboxes.
- What repo/worktree naming convention should we use for the governed fork.
- Which Mission Control v1 modules should be implemented immediately versus stubbed for v1.5.

## Next Steps
1. Choose the fork location and naming convention.
2. Identify and disable the exact repair/doctor/provisioning surfaces in the fork.
3. Begin the first safe reshape pass on the isolated Builderz codebase.
4. Add Chief of Staff Queue and Maintenance Queue as the first custom modules.
