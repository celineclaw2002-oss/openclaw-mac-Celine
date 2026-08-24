# Promotion Gates

## Purpose

This file defines how a strategy sleeve moves from research to paper trading to production-style autonomy.

## Gate 1: Research to paper

Minimum requirements:

- point-in-time replay exists
- replay uses archived or truly point-in-time market surfaces, not frozen live books or model-synthesized quotes
- baseline benchmark is documented
- proper scoring is available for the core model
- execution assumptions are explicit
- overlap controls exist for the relevant family

## Gate 2: Paper to expanded paper capital

Minimum requirements:

- stable behavior across multiple market regimes
- historical replay is economically positive after explicit execution assumptions, not just statistically interesting
- no unresolved semantic ambiguities in the traded family
- turnover and spread-cost diagnostics remain acceptable
- research snapshot history is reproducible
- position concentration is explained and monitored

## Gate 3: Expanded paper to production candidate

Minimum requirements:

- artifact provenance is live for every run
- promotion scorecards are archived
- monitoring exists for stale data, drift, and execution anomalies
- scenario stress results are acceptable
- portfolio allocation logic is sleeve-aware rather than market-by-market

## Policy

No sleeve should move forward because a recent PnL run looks exciting in isolation. Promotion requires semantic confidence, calibration confidence, execution confidence, and risk confidence together.

Synthetic or circular validation does not count. If the quote surface is generated from the same model being evaluated, the result is research scaffolding, not promotion evidence.
