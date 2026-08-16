# Prediction Markets Research - 2026-08-08

## Summary

Built a reusable venue primer on Kalshi and Polymarket for future prediction-market bot research, with emphasis on market structure, fees, APIs, settlement, restrictions, and quant-relevant execution details.

## Decisions

- Treat this as a **market-structure research problem first**, not a model-training problem first.
- Keep **Polymarket perps out of scope** for now; focus only on prediction markets.
- Use a durable research note in the workspace's vault-style structure as the main reference artifact.

## Work completed

- Researched Kalshi primary docs and help-center material:
  - market lifecycle
  - settlement
  - fee model and rounding
  - API auth
  - rate limits
  - public market-data surface
  - onboarding / KYC notes
- Researched Polymarket primary docs and help-center material:
  - event / market / token model
  - order lifecycle
  - CLOB architecture
  - pUSD collateral
  - fees
  - resolution / dispute flow
  - geoblocking
  - deposits / withdrawals
  - real-time data surface
- Wrote the main memo:
  - `10 Research/prediction-markets-kalshi-polymarket-primer-2026-08-08.md`
- Wrote a Track 2 memo focused on leaders and seminal external-anchor literature:
  - `10 Research/prediction-markets-external-anchor-research-map-2026-08-08.md`
- Built five detailed alpha-bucket research memos in the Mission Control Vault:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/1-internal-consistency-research.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/2-cross-venue-relative-value-research.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/3-external-anchor-mispricing-research.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/4-inventory-and-flow-distortions-research.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/5-resolution-and-design-edge-research.md`
- Built a focused Track 3 note on broader quantitative ML researchers whose methods look adaptable to prediction markets:
  - `10 Research/prediction-markets-ml-researchers-track-3-2026-08-08.md`
- Built a Track 1 transfer memo focused on market microstructure, LOBs, structured prediction, and market-making:
  - `10 Research/prediction-markets-ml-market-microstructure-transfer-memo-2026-08-08.md`
- Wrote two separate pre-testing blueprints in the Vault for the two highest-priority ideas:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-blueprint-01-internal-consistency-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-blueprint-02-external-anchor-mispricing-2026-08-16.md`
- Added the next layer of remote-prep execution documents:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-normalization-and-relationship-graph-spec-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-30-day-pilot-plan-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-normalization-build-sheet-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-testing-and-simulation-spec-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-data-acquisition-and-storage-plan-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-research-schema-and-observation-views-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-v1-experiment-pack-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-implementation-workbreakdown-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-prioritized-family-selection-memo-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-modules-1-3-build-plan-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-modules-4-6-build-plan-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-modules-7-8-build-plan-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-phase-d-through-f-validation-memo-2026-08-16.md`

## Current conclusions

- `Internal consistency` looks like the strongest structural bucket, especially partitions, ladders, temporal nesting, and Polymarket combo or synthetic inconsistencies.
- `External-anchor mispricing` looks strong when scoped narrowly to objective finance-linked contracts such as Fed, CPI, jobs, and BTC threshold markets.
- `Cross-venue relative value` is real but should be treated as a constrained pilot because legal deployability, overlap, and hedgeability are likely binding.
- `Inventory and flow distortions` looks promising as a microstructure sleeve rather than the whole strategy franchise.
- `Resolution and design edge` looks real but niche: likely high-alpha, lower-frequency, and hard to scale, especially around Polymarket clarifications, neg-risk design, and dispute timing.
- For external-anchor work specifically, the strongest literature bridge now looks like:
  - option-implied threshold probabilities for finance-linked contracts
  - rates-implied policy probabilities for Fed-linked contracts
  - macro nowcasting for CPI, jobs, and GDP-release markets
  - growth-at-risk style threshold-event modeling for recession and downside macro markets
- For adaptable ML methods, the highest-value imports look like:
  - `Gneiting` for calibration and proper scoring discipline
  - `Kipf/Welling` and `Velickovic` for graph-based internal consistency across related contracts
  - `Bryan Lim` plus `DeepAR`-style global probabilistic forecasting for external-anchor markets
  - `Nevmyvaka/Kearns` for execution once fair-value estimates exist
- For the internal-consistency sleeve specifically, the strongest imported stack now looks like:
  - a structured coherence model across linked contracts
  - Cont/Cartea-style event-flow and imbalance features
  - a queue-aware executability model
  - an inventory-aware execution overlay
- After the final blueprint pass, the two highest-priority strategies now rank as:
  1. internal consistency
  2. external-anchor mispricing
- Key refinement from the earlier research stage:
  - these are now framed as two distinct alpha programs with different data models, validation ladders, execution assumptions, and kill criteria
  - internal consistency is treated as the first structural wedge
  - external-anchor mispricing is treated as the second, more institutionally legible fair-value wedge
- New implementation conclusion:
  - the first build should emphasize `Kalshi-clean semantics first`
  - then selectively add `Polymarket structural coverage`
  - external-anchor work should remain narrowed to one or two families after the normalizer exists

## Important files

- Main research note:
  - `/Users/canozgel-macmini/.openclaw/workspace/10 Research/prediction-markets-kalshi-polymarket-primer-2026-08-08.md`
- Track 2 external-anchor literature memo:
  - `/Users/canozgel-macmini/.openclaw/workspace/10 Research/prediction-markets-external-anchor-research-map-2026-08-08.md`
- Track 3 ML researchers note:
  - `/Users/canozgel-macmini/.openclaw/workspace/10 Research/prediction-markets-ml-researchers-track-3-2026-08-08.md`
- Track 1 microstructure transfer memo:
  - `/Users/canozgel-macmini/.openclaw/workspace/10 Research/prediction-markets-ml-market-microstructure-transfer-memo-2026-08-08.md`
- Alpha-bucket vault folder:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets`
- Blueprint Vault notes:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-blueprint-01-internal-consistency-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-blueprint-02-external-anchor-mispricing-2026-08-16.md`
- Normalization and pilot notes:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-normalization-and-relationship-graph-spec-2026-08-16.md`
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-30-day-pilot-plan-2026-08-16.md`

## Open questions

- Which venue should be the first live research target: Kalshi, Polymarket, or both?
- Which specific contract families map cleanly to external fair-value anchors?
- What are the legal/compliance constraints around personal trading and automated prediction-market activity post-Morgan Stanley onboarding?
- How much latency sensitivity do we actually want to own in v1?

## Next steps

1. Build the contract-normalization and relationship-graph layer needed for Blueprint 01.
2. Start with `Kalshi threshold and bucket markets` as the cleanest first semantic layer.
3. Build the fair-value mapping and calibration layer needed for Blueprint 02 after the normalizer exists.
4. Start testing in rank order:
   - Blueprint 01 first
   - Blueprint 02 second
5. Use the 30-day pilot plan to sequence the capture schema and backtest ladder.
6. Start the external-anchor prototype with a narrow calibrated stack for BTC thresholds or Fed meetings, not everything at once.
7. Use the normalization build sheet as the implementation-grade bridge from the strategy blueprints into actual schema, parser, graph, and research-view construction.
8. Use the testing-and-simulation spec as the shared validation framework for both strategy sleeves before any coding or model fitting starts.
9. Use the data-acquisition-and-storage plan as the capture and replay backbone for the normalizer, simulator, and later anchor joins.
10. Use the research-schema-and-observation-views note to define the exact point-in-time datasets consumed by the edge engines and simulator.
11. Use the V1 experiment pack to define the exact first research program and success thresholds.
12. Use the implementation work breakdown to translate the research stack into modules, dependencies, and milestone order.
13. Use the prioritized family selection memo to constrain the first Kalshi families to BTC threshold ladders first, explicit bucket partitions second, and Fed/policy families third.
14. Use the Modules 1-3 build plan as the concrete first implementation sequence for acquisition, staging parsers, and canonical normalization.
15. Use the Modules 4-6 build plan as the graph, state-view, and observation-builder sequence for launching the first internal-consistency research loop.
16. Use the Modules 7-8 build plan as the anchor-stack and simulator sequence for transitioning from structural detection into comparative alpha testing.
17. Use the Phase D-F validation memo as the final research decision framework from semantic validation through robustness and go/no-go.

## 2026-08-16 Phase A review cleanup

- Ran a dedicated subagent review on the completed Phase A stack.
- Fixed an internal contradiction in the prioritized-family memo so the family order is now consistently:
  1. `Kalshi BTC threshold ladders`
  2. `Kalshi bucket partitions with explicit ranges`
  3. `Kalshi Fed decision / policy bucket families`
- Repaired broken continuity paths in this topic file so the Vault root consistently points to:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets`
- Added a dedicated provider decision note:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-btc-anchor-provider-and-access-decision-2026-08-16.md`
- The BTC external-anchor implementation dependency is now explicit:
  - `Kalshi settlement semantics as truth`
  - `Coinbase for spot monitoring`
  - `Deribit for futures/options anchor construction`
- Added an initial TypeScript scaffold at:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack`
- Expanded the scaffold beyond interfaces:
  - Module 1 now includes concrete Kalshi source-event construction and in-memory acquisition sinks
  - Module 2 now includes staging parsers for `discovery`, `metadata`, `book`, `trade_ticker`, and `lifecycle_fee`
  - Module 3 now emits canonical settlement semantics needed for the BTC anchor sleeve:
    - `resolution source`
    - `settlement timestamp convention`
    - `settlement timezone`
    - `observation-window text`
  - Module 4 now exposes graph contracts for:
    - complements
    - partition edges
    - threshold ladders
    - temporal nesting
  - Modules 5-8 now have deterministic in-memory builders for:
    - quote / lifecycle / fee / execution state views
    - internal-consistency and external-anchor observations
    - BTC threshold anchor states
    - trade simulations
- Verified the scaffold typechecks cleanly with:
  - `npm install`
  - `npm run check`
  - `npm run build`
  - `npm run demo`
- Added a deterministic example pipeline:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/examples/kalshi-btc-threshold-demo.ts`
- The demo currently proves an end-to-end slice from Kalshi-style payload capture through staging, normalization, graph generation, and summary output.
