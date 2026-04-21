# Mission Control Baseline Script

## Purpose

Create a repeatable baseline capture before evaluating Builderz Mission Control.

## Script

- `scripts/mission-control-capture-baseline.sh`

## What it captures

- OpenClaw status, devices, and node status
- process list
- listening ports snapshot
- launch agent list
- workspace git status
- shell config snapshots
- key `.openclaw` file listings
- compressed backup of `~/.openclaw`

## Usage

```bash
bash scripts/mission-control-capture-baseline.sh
```

Optional custom output root:

```bash
bash scripts/mission-control-capture-baseline.sh ~/openclaw-eval-baselines
```

## Notes

- Run this before any Builderz evaluation.
- Keep the resulting timestamped folder untouched for comparison.
- A matching post-test capture procedure can be added next for before/after diffs.
