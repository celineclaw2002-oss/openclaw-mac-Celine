# Mission Control Runtime Health Check

## Purpose

Run this after any Builderz evaluation to confirm OpenClaw still behaves normally.

## Script

- `scripts/mission-control-runtime-health-check.sh`

## What it checks

- OpenClaw status
- device and node status
- shell execution sanity
- processes and listening ports
- launch agents
- workspace git state

## Usage

```bash
bash scripts/mission-control-runtime-health-check.sh
```

Optional custom output root:

```bash
bash scripts/mission-control-runtime-health-check.sh ~/openclaw-eval-healthchecks
```

## Important note

This script covers system and runtime sanity, but you should still manually verify:
- image handling in chat
- sub-agent spawning
- messaging/channel behavior

## Recommendation

Use this immediately after any Builderz test, before deciding whether the environment is still safe.
