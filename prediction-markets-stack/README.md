# Prediction Markets Stack

Initial research-stack scaffold for the Kalshi-first prediction-markets program.

This project mirrors the research module plan:

1. venue acquisition
2. raw-to-staging parsing
3. canonical normalization
4. relationship graph
5. research-state views
6. observation builders
7. external-anchor stack
8. simulator and experiment runner

The goal of this scaffold is not to pretend the full stack is built. It exists to give the program a stable code contract so the remaining work can proceed without schema drift.

Current live/replay entry points:

- `npm run demo`
  - runs the deterministic Kalshi-style demo slice
- `npm run capture:kalshi`
  - hits Kalshi's public API
  - captures candidate live markets
  - persists raw, staging, normalized, and graph outputs under `data/kalshi-live/`
- `npm run audit:semantic`
  - audits the latest replayed Kalshi live slice by default
  - checks discovery replay integrity, threshold semantics, and graph constraints
  - writes `summaries/semantic-audit.json` into the audited capture folder
- `npm run capture:coinbase-btc`
  - captures a live `Coinbase BTC-USD` spot snapshot into the latest replay folder
  - writes raw, snapshot, and summary anchor files under `anchors/`
- `npm run capture:deribit-btc`
  - captures live `Deribit` BTC futures/options anchor inputs into the latest replay folder
  - writes raw universe snapshots plus selected near-expiry futures/options slices under `anchors/`
- `npm run audit:anchor-input`
  - audits the latest replay folder for cross-source timing and lineage consistency across Kalshi, Coinbase, and Deribit
- `npm run audit:btc-anchor-mapping`
  - produces a contract-by-contract BTC threshold mapping audit against the current anchor inputs
- `npm run build:btc-raw-anchor`
  - builds a first raw BTC threshold probability baseline from the current mapping audit and Deribit inputs
- `npm run session:btc-observation`
  - runs one end-to-end BTC observation session into a fresh replay folder:
    Kalshi live capture, semantic audit, Coinbase spot capture, Deribit anchor capture, anchor-input audit, BTC mapping audit, and raw anchor baseline
- `npm run build:btc-anchor-residuals`
  - turns the BTC raw anchor baseline into external-anchor residual observations
- `npm run run:btc-anchor-experiments`
  - runs deterministic external-anchor trade simulations across execution templates and residual thresholds
  - writes experiment rows under `simulations/` and a family scorecard under `summaries/`
- `npm run run:btc-paper-loop`
  - runs a fresh BTC observation session by default
  - builds anchor residual observations and a baseline experiment slice
  - updates a persistent paper portfolio under `data/paper-trading/btc-anchor/`
  - writes loop-by-loop entry, exit, hold, cash, exposure, and PnL summaries
  - updates `performance-summary.json` with cumulative return, loop Sharpe/Sortino, turnover, exposure, drawdown, and trade stats
- `npm run scan:polymarket-btc`
  - scans Polymarket public event data for BTC milestone-style markets
  - writes a reserve-path viability summary under `data/polymarket-live/`
  - helps decide whether the always-on BTC sleeve should pivot away from Kalshi-only timing windows
- `npm run run:polymarket-btc-paper-loop`
  - runs the Polymarket BTC milestone scanner plus a Coinbase-based barrier-hit anchor
  - maintains a persistent paper portfolio under `data/paper-trading/polymarket-btc-milestone/`
  - gives the BTC program an always-on reserve sleeve even when Kalshi BTC families are pre-open
- `npm run backtest:polymarket-btc-barrier`
  - pulls historical daily BTC candles from Coinbase
  - builds synthetic BTC milestone / barrier-hit observations across horizons and barrier levels
  - compares raw first-passage barrier probabilities against a terminal-only baseline and an isotonic-calibrated variant
  - writes historical model-quality summaries under `data/backtests/polymarket-btc-barrier/`
