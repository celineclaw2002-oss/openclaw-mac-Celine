# Builderz Backup and Diff Procedure

Use this procedure before any Builderz evaluation.

## Goal

Make every test reversible and auditable.

## Backup targets

At minimum, capture copies of:
- `~/.openclaw`
- shell configuration files used by the current environment
- relevant LaunchAgents or startup service definitions
- any local config tied to terminal, agent runtime, or image handling

## Minimum backup workflow

1. Create a timestamped backup folder outside the repo.
2. Copy the full `~/.openclaw` tree into it.
3. Copy relevant shell config files into it.
4. Export a snapshot of current launch agents / running services.
5. Export a snapshot of listening ports and key process list.
6. Save git status for the workspace.

## Diff workflow

Before test:
- capture directory listings and timestamps for `~/.openclaw`
- capture key config files
- capture service/process snapshot
- capture port snapshot

After test:
- repeat the same captures
- compare:
  - files created, modified, or deleted
  - PID/log cleanup side effects
  - changed config paths or env files
  - new services, launch agents, or listeners

## What to compare carefully

- `openclaw.json`
- gateway-related config
- sessions/state directories
- logs and PID files
- launch agents
- shell startup files
- any Mission Control env files or generated credentials

## Rule

Do not proceed from isolated testing to deeper integration unless the before/after diff is understood and acceptable.
