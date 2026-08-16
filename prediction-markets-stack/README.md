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
