# Mission Control Diff Script

## Purpose

Compare a pre-test baseline and a post-test baseline for Builderz evaluation.

## Script

- `scripts/mission-control-compare-baselines.sh`

## Usage

```bash
bash scripts/mission-control-compare-baselines.sh <before-baseline-dir> <after-baseline-dir>
```

Example:

```bash
bash scripts/mission-control-compare-baselines.sh \
  ~/openclaw-eval-baselines/20260408-120000 \
  ~/openclaw-eval-baselines/20260408-130000
```

## Output

The script writes a `diff-report/` directory inside the second baseline folder.

It compares:
- OpenClaw status snapshots
- devices and node status
- process list
- port snapshot
- launch agents
- workspace git state
- `.openclaw` file and directory listings
- `openclaw.json` when present

## Notes

- Run the baseline capture script before and after a Builderz test.
- Review the generated diff report before allowing deeper integration.
