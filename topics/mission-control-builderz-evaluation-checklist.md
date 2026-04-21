# Builderz Mission Control Evaluation Checklist

Use this checklist before and during any Builderz evaluation.

## Goal

Evaluate product fit without damaging the live OpenClaw environment.

## Success criteria

- Builderz can be explored without modifying live OpenClaw state.
- OpenClaw keeps working normally after each test.
- No unexpected service, config, permission, or gateway drift occurs.
- We can identify which modules are useful enough to justify deeper adoption.

## Phase 0 — Preconditions

- [ ] Confirm current OpenClaw setup is healthy.
- [ ] Confirm latest repo state is committed and pushed.
- [ ] Confirm backup artifacts exist before any Builderz touch.
- [ ] Confirm test will not target the real `~/.openclaw` state first.
- [ ] Confirm no repair, doctor, or provisioning flow will be used.

## Phase 1 — Isolated product review

- [ ] Run Builderz in isolated mode only.
- [ ] Do not connect it to the real gateway.
- [ ] Do not mount the real OpenClaw state directory.
- [ ] Do not install skills from inside Builderz.
- [ ] Inspect these surfaces only:
  - [ ] Dashboard
  - [ ] Agents
  - [ ] Tasks / kanban
  - [ ] Scheduler / cron
  - [ ] Usage / cost tracking
  - [ ] Chat / comms
  - [ ] Skills
  - [ ] Memory / logs
  - [ ] Security / settings
- [ ] Record what feels useful, missing, confusing, or risky.

## Phase 2 — Throwaway-state integration test

- [ ] Create a copied throwaway OpenClaw state directory.
- [ ] Point Builderz only at that copied state.
- [ ] Verify read-oriented features first.
- [ ] Check whether Builderz rewrites config, state, logs, or PID files.
- [ ] Check whether session discovery works without side effects.
- [ ] Check whether terminal-backed activity still behaves normally in the copied state.

## Phase 3 — Post-test verification

- [ ] Compare file and directory diffs.
- [ ] Check for new services, launch agents, ports, or listeners.
- [ ] Re-verify OpenClaw shell execution.
- [ ] Re-verify image handling.
- [ ] Re-verify sub-agent spawning.
- [ ] Re-verify messaging/channel health.
- [ ] Decide: continue, isolate further, fork first, or reject.

## Stop conditions

Stop immediately if any of the following happens:
- OpenClaw loses terminal access.
- Image handling breaks.
- Unexpected writes hit the live `~/.openclaw` tree.
- Gateway behavior changes unexpectedly.
- Builderz proposes or performs repair/provisioning actions.
- New persistent services appear without explicit approval.
