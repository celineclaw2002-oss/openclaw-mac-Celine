# Prediction Markets Model Overhaul - 2026-08-24

## What we decided

- The current `Polymarket BTC milestone` sleeve should **not** keep taking fresh risk in its present form.
- The main reason is not just weak returns. The validation stack is materially compromised by:
  - synthetic or frozen historical market surfaces
  - a deployment gate derived from calibration quality rather than tradable edge
  - concentration in one BTC directional cluster
  - venue restriction risk
- The `Kalshi internal-consistency` sleeve remains the more credible research direction, but the current positive evidence is still too thin to call it production-grade alpha.

## What was accomplished

- Audited existing performance and research artifacts in `prediction-markets-stack`.
- Confirmed:
  - `Polymarket BTC` synthetic replay lost money and had double-digit drawdown
  - the live paper loop had no realized trade validation before this pass
  - the internal-consistency walk-forward result is positive but based on only `2` realized trades in `KXFED`
- Added a deployment gate to [`prediction-markets-stack/src/pipelines/polymarket-btc-paper-loop.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-paper-loop.ts) that blocks new entries when:
  - the reserve path is not fully tradable
  - the historical replay uses synthetic or frozen market surfaces
  - the historical replay is loss-making or finishes below starting capital
  - historical replay drawdown breaches `10%`
- Verified the gate live:
  - the next run force-exited the open BTC milestone positions and blocked fresh entries
- Tightened the research readiness audit in [`prediction-markets-stack/src/pipelines/research-platform-readiness-audit.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/research-platform-readiness-audit.ts) so it now penalizes:
  - synthetic replay
  - failed recalibration
  - paper loops with no realized trade validation
  - negative historical portfolio replay
  - one-direction concentration
- Fixed a replay allocation bug in [`prediction-markets-stack/src/pipelines/polymarket-btc-portfolio-replay.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-portfolio-replay.ts) so sleeve assignment uses the strongest sleeve contribution rather than always the first sleeve.
- Updated promotion rules in [`prediction-markets-stack/docs/promotion-gates.md`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/docs/promotion-gates.md) to explicitly reject synthetic or circular validation.
- Added a broader internal-consistency validator in [`prediction-markets-stack/src/pipelines/internal-consistency-validation-matrix.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/internal-consistency-validation-matrix.ts) and wired it into `package.json` as `npm run validate:internal-consistency`.
- Ran the new validator and confirmed that even the best current internal-consistency series still fails minimum breadth gates:
  - `KXFED` has positive walk-forward PnL, but only `2` trades
  - only `1` traded capture
  - only `1` unique event
  - verdict: `weak`, not promotable

## Important files and evidence

- Core sleeve gate:
  - [`prediction-markets-stack/src/pipelines/polymarket-btc-paper-loop.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-paper-loop.ts)
- Audit hardening:
  - [`prediction-markets-stack/src/pipelines/research-platform-readiness-audit.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/research-platform-readiness-audit.ts)
- Promotion policy:
  - [`prediction-markets-stack/docs/promotion-gates.md`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/docs/promotion-gates.md)
- Replay allocation fix:
  - [`prediction-markets-stack/src/pipelines/polymarket-btc-portfolio-replay.ts`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-portfolio-replay.ts)
- Key artifacts:
  - [`prediction-markets-stack/data/backtests/polymarket-btc-research-backfill/portfolio-replay/replay-summary.json`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/backtests/polymarket-btc-research-backfill/portfolio-replay/replay-summary.json)
  - [`prediction-markets-stack/data/backtests/polymarket-btc-barrier/20260820T134713906Z/summaries/barrier-backtest-summary.json`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/backtests/polymarket-btc-barrier/20260820T134713906Z/summaries/barrier-backtest-summary.json)
  - [`prediction-markets-stack/data/backtests/internal-consistency-walk-forward/20260824T080553747Z/walk-forward-summary.json`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/backtests/internal-consistency-walk-forward/20260824T080553747Z/walk-forward-summary.json)
  - [`prediction-markets-stack/data/backtests/internal-consistency-validation-matrix/20260824T082029228Z/validation-matrix-summary.json`](/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/backtests/internal-consistency-validation-matrix/20260824T082029228Z/validation-matrix-summary.json)

## Research directions kept alive

- Best path if we revisit the BTC milestone sleeve:
  - replace constant-vol GBM first-passage with a discrete-monitoring jump/stochastic-vol model
  - use better horizon-aware volatility forecasts, ideally realized plus implied inputs
  - replace isotonic with logistic or beta calibration, or drop recalibration unless it wins out of sample
  - add an explicit favorite-longshot bias layer
  - add a hard execution gate for spread, staleness, and adverse selection
- Best current platform path:
  - push deeper into `Kalshi internal-consistency` only if we can broaden the market family set and gather materially more event diversity

## Open questions and risks

- The internal-consistency sleeve still lacks enough realized walk-forward evidence to justify strong alpha claims.
- Current temporal-nested internal-consistency breadth is effectively one viable series, `KXFED`.
- The BTC milestone sleeve may only be salvageable as a much narrower short-horizon near-barrier strategy, if at all.
- Historical Polymarket quote archives are still the biggest missing input for any honest Polymarket strategy decision.

## Next steps

1. Expand Kalshi capture coverage beyond the current narrow temporal-nested pocket so internal-consistency is tested across more than one viable series.
2. Keep the explicit alpha gates now implemented:
   - minimum realized trades
   - minimum traded captures
   - minimum unique events
3. If revisiting BTC milestone, prototype a hazard / jump-vol model and test it only against non-circular historical data.
4. Keep the current Polymarket BTC sleeve blocked unless those conditions are met.
