# Mac mini Migration Plan

## Current summary
A step-by-step migration plan for moving Can's OpenClaw and future Mission Control setup from the current MacBook Air to a new Mac mini. Default local model recommendation for the Mac mini 24 GB / 256 GB setup is Gemma 3 12B, chosen for best overall system fit across always-on orchestration, multimodal support, and headroom for the rest of the stack.

## Decisions
- Treat the Mac mini as the future always-on home base for OpenClaw.
- Optimize for stable 24/7 operation, not maximum benchmark model size.
- Recommended primary local model: Gemma 3 12B.
- Use a hybrid model strategy: local for routine orchestration and multimodal understanding, remote frontier models for hard reasoning and heavier coding.
- Keep the migration staged so Can can validate each layer before cutting over fully.

## Planned phases
1. Unbox and complete first-boot macOS setup.
2. Apply system updates, security baseline, and account sign-ins.
3. Install base tooling and restore workspace/repositories.
4. Install OpenClaw and verify core runtime health.
5. Configure local model hosting and validate Gemma 3 12B performance.
6. Reconnect integrations, permissions, and companion services.
7. Add Mission Control stack once OpenClaw is stable.
8. Run side-by-side burn-in with the MacBook Air.
9. Cut over primary operations to the Mac mini.
10. Post-cutover hardening, cleanup, and documentation.

## Relevant files and context
- `USER.md`
- `topics/mac-mini-migration-plan.md`
- `memory/2026-04-08.md`
- `memory/2026-04-09.md`

## Open questions
- Whether Can will use a direct monitor/keyboard/mouse setup during initial boot or remote setup soon after.
- Whether external SSD storage will be added for models, logs, and archives.
- Whether Mission Control will live in the same repo/runtime initially or be isolated into a separate deployable service.

## Next steps
- Flesh out the plan into a detailed checklist from sealed box to cutover.
- Later, add a machine-ready runbook with exact install commands.
- After the migration plan is approved, record any storage or networking decisions that affect final architecture.
