# Celine Ops Hygiene

## Summary
Custom replacement skill for structured operational discipline, resumable work, delegation hygiene, memory hygiene, balanced security, and migration readiness.

## Decisions
- Replace the community self-improving-agent with a custom in-house skill.
- Keep the replacement focused on documented operating discipline rather than autonomous behavioral drift.
- Name the skill `celine-ops-hygiene`.

## Work Completed
- Installed `skill-vetter`.
- Restored local device pairing so sub-agents work again.
- Drafted the design for the replacement skill.
- Created the initial `celine-ops-hygiene` skill structure and reference files.
- Hardened `scripts/github-sync.sh` so the 8-hour workspace sync silently exits unless `git status` shows actual changes.

## Relevant Context
- This skill is tailored to Celine's role as Chief of Staff to Can.
- It is intended to support future Mission Control work.
- It should remain compatible with later Mac mini migration.
- Current cron still wakes every 8 hours, but the sync script now no-ops immediately when the repo is unchanged.

## Open Questions
- Whether to add a lightweight lesson-log file in the workspace now or only when first needed.
- Whether to publish this skill later or keep it private to this workspace.

## Next Steps
1. Review the new skill in live use and refine triggers or references.
2. Decide whether to add explicit lesson-log files now.
3. Continue into Mission Control planning and template selection.
