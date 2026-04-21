# Skills Bootstrap

## Summary
Initial setup topic for building Celine's skill repository, safety guardrails, core integrations, and operating environment.

## Decisions
- Celine acts as Chief of Staff.
- By default, substantive work should be delegated to sub-agents so Celine remains available as coordinator.
- Conversations should stay casual unless detail is needed.
- Each completed topic should be summarized in a dedicated file under `topics/` for easy resume after chat context is cleared.
- Immediate priority is to build secure skills, help the system learn from mistakes, connect key services, and prepare for Mission Control.

## Work Completed
- Established assistant identity as Celine.
- Recorded user identity, pronunciation, role, preferences, and high-level goals.
- Created topic-summary workflow and this topic file.
- Documented delegation default and resumable-memory policy in workspace guidance.
- Verified `gog` is installed and that the dedicated Google account `celine.claw2002@gmail.com` is connected as default.
- Confirmed Gmail read access by listing recent inbox messages.
- Sent a live Gmail test email to `canozgel@gmail.com`.
- Created and verified a live Google Calendar test event on the primary calendar, then deleted it after confirmation.
- Created, wrote to, and read back a live Google Doc test document.
- Verified `remindctl` is installed for Apple Reminders.
- Confirmed Apple Reminders access after privacy permissions were enabled.
- Listed current reminders successfully.
- Created and verified a live Apple Reminder test item: `Celine remindctl test` due 2026-04-09 09:00.
- Verified `memo` is installed for Apple Notes.
- Confirmed Apple Notes read access by listing existing notes successfully.
- Identified that note creation through `memo` currently uses an interactive flow that may need a small automation helper for reliable scripted writes.

## Relevant Context
- Current machine: MacBook Air.
- Planned migration target: dedicated Mac mini, 24 GB RAM, 256 GB storage, expected in 3-4 weeks.
- Long-term agent roster may include Trading Bot, Code Review, Researcher, and other specialist agents.
- User is preparing for a Morgan Stanley Fixed Income Sales Strat Summer Associate role and finishing a Columbia MS in Management Science and Engineering.
- Dedicated Google account confirmed: `celine.claw2002@gmail.com`.
- Test Google Doc: `1Kzrr6pgeKQxLp-lUmSOCAwSp6kKVKv5FkiG912CICzs`.
- Test email subject: `Celine gog test email`.
- Test Apple Reminder: `Celine remindctl test` due `2026-04-09 09:00` in list `Reminders`.

## Open Questions
- Which GitHub Mission Control template should we start from?
- What exact permanent specialist agents should be part of the first roster beyond Trading Bot, Code Review, and Researcher?
- Do we want a lightweight helper for scripted Apple Notes creation, or should that wait for the Mac mini migration?

## Confirmed Preferences
- Tiny tasks can be handled directly by Celine for now.
- Non-trivial work should default to sub-agents.
- Security posture should be balanced, leaning conservative, until the Mac mini is live.
- Integration order should start with GitHub, then Google, then Apple Reminders / Apple ecosystem, then calendar and email flows, then Mission Control.
- Mission Control should start from a GitHub template and then be customized.
- All work should be pushed to the connected GitHub repository.

## Next Steps
1. Decide whether to keep or clean up the Apple Reminder test item.
2. On Mac mini migration, continue Apple ecosystem setup beyond Reminders and verify robust Apple Notes write automation.
3. Audit security and host hardening requirements for the current MacBook Air setup.
4. Choose and evaluate the Mission Control template repository.
5. Design the first permanent sub-agent roles and boundaries.
