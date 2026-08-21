# Prediction Markets Platform End State

## North Star

Build a prediction-markets research and execution platform that a hedge-fund head of quant would recognize as institutionally serious:

- every signal is point-in-time reproducible
- every model is benchmarked and properly scored
- every trade recommendation is portfolio-aware
- every artifact is auditable from raw payload to decision
- every promotion from research to paper to production is gated

## What “done properly” means

The finished platform is not just a collection of scripts. It is a research operating system with six properties:

1. **Semantic correctness**
   Every contract is normalized into canonical event semantics so related contracts can be compared, netted, stress-tested, and scored coherently.

2. **Point-in-time integrity**
   Historical research can be replayed exactly from archived venue and anchor data without look-ahead contamination.

3. **Probabilistic discipline**
   Fair values are judged with proper scoring rules, calibration, segmented backtests, and rolling benchmark comparisons.

4. **Execution realism**
   Signal quality is separated from executable quality using fill, spread, depth, and turnover assumptions.

5. **Portfolio construction**
   The system allocates capital across overlapping contracts, sleeves, and venues rather than treating every market as independent.

6. **Operational auditability**
   Any live decision can be traced to data version, model version, config, simulation assumption, and risk gate.

## End-State Capabilities

### 1. Data and replay

- Multi-venue capture for Kalshi, Polymarket, and anchor feeds
- Archived point-in-time quote surfaces
- Historical replay for both research snapshots and portfolio evolution
- Dataset lineage from raw payload to final scorecard

### 2. Semantic normalization

- Canonical contract model for thresholds, buckets, complements, partitions, and temporal nesting
- Cross-venue linking of economically identical or related contracts
- Relationship graphs that support both internal-consistency alpha and exposure de-duplication

### 3. Modeling and calibration

- Interpretable baseline models per family
- Proper scoring and calibration monitoring
- Walk-forward validation by regime and horizon
- Ensemble stack spanning structural, anchor, and flow sleeves

### 4. Simulation and execution

- Deterministic execution templates
- Queue/depth/latency-aware execution simulator
- Unified paper trading loop across sleeves and venues
- Historical portfolio replay with turnover and slippage attribution

### 5. Portfolio and risk

- Overlap-aware sizing
- Concentration and crowding limits
- Scenario and liquidity stress testing
- Sleeve-level capital allocator

### 6. Production governance

- Run manifests with model, dataset, and config provenance
- Monitoring for stale data, drift, and execution anomalies
- Explicit promotion gates from research to paper to production

## Current build direction

The project should now be developed against this target state rather than adding isolated features opportunistically.

Immediate program order:

1. Finish historical replay as a portfolio-aware simulator.
2. Add run manifests and provenance for every major pipeline.
3. Generalize risk from single-family ladder controls to portfolio-level allocation and stress.
4. Expand from BTC-only anchor logic to a sleeve library with benchmark tables.
