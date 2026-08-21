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

## 2026-08-16 Live capture and first anchor-input phase

- Moved beyond the deterministic demo into a public-API Kalshi live-capture slice inside:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack`
- Added live runtime pieces:
  - `src/runtime/kalshi-api.ts`
  - `src/runtime/filesystem-store.ts`
  - `src/pipelines/kalshi-live-capture.ts`
- Added a CLI entrypoint:
  - `npm run capture:kalshi`
- Added a replay-control CLI entrypoint:
  - `npm run audit:semantic`
- Added first external-anchor capture entrypoints:
  - `npm run capture:coinbase-btc`
  - `npm run capture:deribit-btc`
  - `npm run audit:btc-anchor-mapping`
  - `npm run audit:anchor-input`
  - `npm run build:btc-raw-anchor`
  - `npm run session:btc-observation`
- Extended the scaffold so the live path now covers:
  - public discovery from `/markets`
  - market metadata capture
  - orderbook capture
  - trade-ticker extraction
  - lifecycle / fee extraction
  - canonical normalization into contracts / thresholds / buckets / rules
  - deterministic graph generation
  - deterministic quote / lifecycle / fee / execution state views
  - internal-consistency observations
  - first-pass simulations
- Important semantic fixes made during the live phase:
  - per-series candidate caps now allow the live capture to reach multiple target families instead of stopping after BTC
  - raw discovery capture is now stored as page-native `/markets` payloads, not mislabeled per-market detail payloads
  - threshold records now carry `evaluationTimestampMs`
  - threshold ladders no longer create monotonicity edges across opposite operator families
  - bucket observation-window extraction preserves decimal upper bounds like `72299.99`
  - incomplete bucket subsets no longer emit false `partition_sum` / `sum_to_one` edges
- Latest validated and audited live output folder:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T155301013Z`
- Latest validated live summary:
  - `pagesFetched: 2`
  - `candidateMarkets: 68`
  - `sourceEventsCaptured: 274`
  - `normalizedContracts: 68`
  - `thresholds: 20`
  - `buckets: 48`
  - `graphEdges: 65`
  - `quoteStates: 68`
  - `internalObservations: 65`
  - `internalSimulations: 10`
- Latest semantic-audit result on that folder:
  - `0 findings`
  - `2 discovery events`
  - audit output written to:
    `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T155301013Z/summaries/semantic-audit.json`
- The current live family mix now includes:
  - `KXBTC`
  - `KXFED`

## First anchor-input layer now live

- Coinbase spot snapshots are now captured into the replay folder as the first practical spot sanity layer:
  - `anchors/coinbase-btc-spot-raw.json`
  - `anchors/coinbase-btc-spot-snapshot.json`
  - `anchors/coinbase-btc-spot-summary.json`
- Deribit BTC futures/options inputs are now captured into the same replay folder as the first practical forward / options anchor layer:
  - `anchors/deribit-btc-anchor-raw.json`
  - `anchors/deribit-btc-anchor-snapshot.json`
  - `anchors/deribit-btc-anchor-summary.json`
  - `anchors/deribit-btc-futures-selected.json`

## 2026-08-21 Historical research replay layer

- Added a new historical replay/backfill pipeline at:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-research-backfill.ts`
- Added a CLI entrypoint:
  - `npm run backfill:polymarket-btc-research`
- The replay runner reuses the same `ResearchSnapshot` schema from the live Polymarket BTC paper loop so the historical artifacts are directly comparable on:
  - regime tags
  - candidate-book diagnostics
  - spread / edge diagnostics
  - the same zeroed portfolio-dependent sections when running in research-only mode
- The live paper loop was refactored slightly so the snapshot helpers are reusable and point-in-time stable:
  - `buildCandidate`
  - `buildResearchSnapshot`
  - `buildRegimeTagsFromCandles`
  - `loadBacktestPolicy`
  - historical horizon calculations now accept an explicit replay timestamp instead of always using wall-clock `Date.now()`
- The backfill runner supports two quote-surface modes:
  - `terminal_baseline` as the default, which builds a synthetic yes-mid from barrier-hit and terminal baseline probabilities so research is not blocked by missing archived Polymarket books
  - `frozen_live`, which reuses the current live market quote surface across past BTC timestamps for factor-state archaeology
- The runner writes:
  - `raw/candles.json`
  - `raw/base-markets.json`
  - `snapshots/*.json`
  - `summaries/research-snapshot-history.json`
  - `summaries/research-backfill-summary.json`
- First validated sample run:
  - output root:
    `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/backtests/polymarket-btc-research-backfill/20260821T073711656Z`
  - command shape:
    `runPolymarketBtcResearchBackfill({ startIso: '2026-01-01T00:00:00.000Z', endIso: '2026-08-01T00:00:00.000Z', stepDays: 14 })`
  - result:
    - `15` snapshots
    - `57` base markets
    - latest timestamp `2026-07-24T00:00:00.000Z`
    - latest snapshot `allowedEntries: 24`
    - latest snapshot `blockedEntries: 25`
- Important interpretation note:
  - this is a `research-state replay`, not a true historical venue-execution replay
  - because historical Polymarket order-book archives are not part of the current stack, concentration / attribution / cost-capture fields remain zero unless we later add a historical execution simulator or archived quote capture

## Current next steps

1. Add a portfolio-aware historical replay mode so concentration and attribution can evolve over time instead of staying zero in research-only backfills.
2. Add CLI flags or env-driven controls for:
   - market-surface mode
   - lookback window
   - step size
   - output root
3. Extend the synthetic quote surface so downside markets and term structure can be stress-tested more explicitly.
4. Use the replay history artifacts to compare:
   - signal density by regime
   - entry gating by historical segment bucket
   - stability of gross edge vs net edge across high-vol and low-vol episodes
  - `anchors/deribit-btc-options-selected.json`
- Current Deribit capture summary on the latest replay slice:
  - `futuresUniverse: 13`
  - `optionsUniverse: 818`
  - `selectedFutures: 3`
  - `selectedOptions: 124`
  - `referenceSpotPrice: 63055.52`
- First BTC threshold mapping audit now exists at:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T155301013Z/anchors/btc-anchor-mapping-audit.json`
- Current mapping-audit conclusion on the two BTC threshold binaries:
  - both map to `CF Benchmarks BRTI`
  - both align to the nearest Deribit future `BTC-18AUG26`
  - nearest-future timing gap is `4` hours
  - relevant selected Deribit option counts are `20` and `18`
  - current mapping-confidence score is `0.9` for both contracts

## First coherent BTC observation session

- The earlier stitched `155301013Z` folder is no longer the best reference artifact for cross-source work.
- A repaired end-to-end BTC observation session now exists at:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T161815454Z`
- This session now includes:
  - Kalshi live capture
  - semantic audit
  - Coinbase spot snapshot
  - Deribit futures/options capture
  - anchor-input audit
  - BTC threshold mapping audit
  - first raw BTC threshold probability baseline
- Current session-level results:
  - `kalshiContracts: 68`
  - `semanticAuditFindings: 0`
  - `anchorInputAuditFindings: 0`
  - `btcAnchorMappings: 2`
  - `rawAnchorProbabilities: 2`
- Important coherence improvement:
  - Deribit now records the exact Coinbase payload ref and observation timestamp used for option selection
  - lineage refs are now session-relative rather than machine-absolute
  - the current Deribit spot-reference age is only `3 ms`
  - selected Deribit futures now carry embedded replayable book state

## Current implementation frontier

- The stack is now past abstract module planning and past deterministic mocks.
- The current frontier is a replayable `Kalshi-first` live research loop with:
  - raw immutable capture
  - staging
  - normalization
  - graphing
  - state views
  - observations
  - first-pass simulation outputs
- The most important remaining build gaps are now higher-order, not foundational:
  1. richer live family coverage and cadence policy
  2. stronger complement / partition family harvesting
  3. better execution-state realism from trade and quote evolution
  4. BTC external-anchor ingestion and alignment
  5. formal semantic audit and detection-study runners over replayed slices

## 2026-08-16 BTC external-anchor phase tightened

- Repaired the BTC external-anchor phase after independent review found point-in-time and replay issues.
- Latest clean reference session is now:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T162545636Z`
- Important coherence fixes made:
  - Deribit source timing now uses selected-book timestamps instead of synthetic pre-fetch local time.
  - Coinbase-vs-Deribit source gap is now recorded explicitly:
    - `referenceSpotGapMs: 307`
    - `referenceSpotAgeMs: 307`
  - anchor-input audit, mapping audit, raw-anchor summary, and residual summary now replay deterministically under fixed code
  - BTC option relevance now requires post-event maturities rather than accidentally using options that expire before the Kalshi event
  - nearest-future selection now prefers expiries that survive the Kalshi event horizon
  - selected Deribit options are now included in anchor-input replayability checks
- Determinism verification:
  - rerunning the fixed audit / mapping / raw-anchor / residual builders twice on `20260816T162545636Z` now leaves artifact hashes unchanged
- Current session-level results on `20260816T162545636Z`:
  - `kalshiContracts: 68`
  - `semanticAuditFindings: 0`
  - `anchorInputAuditFindings: 0`
  - `btcAnchorMappings: 2`
  - `rawAnchorProbabilities: 2`
- Latest mapping-audit conclusions:
  - both BTC threshold binaries map to `CF Benchmarks BRTI`
  - nearest surviving Deribit future is `BTC-18AUG26`
  - nearest-future timing gap remains `4` hours
  - post-event relevant Deribit option counts are now `12` and `12`
- Added the first external-anchor experiment runner:
  - `prediction-markets-stack/src/pipelines/btc-anchor-experiment-runner.ts`
  - CLI: `npm run run:btc-anchor-experiments`
- The experiment runner now produces:
  - trade-level outputs at `simulations/external-anchor-btc-experiments.json`
  - family scorecard at `summaries/external-anchor-btc-scorecard.json`
- First result on the current live slice:
  - the earlier scorecard exposed a real issue:
    - zero / zero placeholder books were being treated as tradable quotes
    - anchor PnL sign handling was wrong for `buy_yes` cases
- Repaired experiment semantics:
  - external-anchor observations now reject locked / zero placeholder quotes
  - anchor trade PnL now uses residual magnitude instead of the raw signed residual
  - residual observations are timestamped at anchor time rather than the later quote time
  - zero-threshold scorecards no longer force trades when the residual signal is exactly `0`
- Latest post-fix session is now:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T164521075Z`
- Latest post-fix experiment semantics are now more precise:
  - `mappedAnchors: 2`
  - `observationsBuilt: 2`
  - `tradableObservations: 0`
  - `nonTradableAnchors: 2`
  - inactive reason breakdown:
    - `pre_open_market: 2`
- Latest scorecard now explicitly states:
  - mapped-but-nontradable BTC contracts are counted and excluded from simulated trades
  - `mappedObservations: 50`
  - `tradableObservations: 0`
  - `nonTradableObservations: 50`
  - `experimentRuns: 0`
- Practical conclusion is now narrower and more honest:
  - the current live BTC anchor slice did not fail because of bad residuals
  - it produced `0` tradable external-anchor opportunities because all `50` mapped BTC contracts in scope were still pre-open at capture time
  - the bucket/range family is now inside the anchor path rather than merely noted as future scope

## 2026-08-16 BTC bucket/range expansion

- Expanded the BTC external-anchor path from threshold tails only into the broader BTC bucket/range family.
- Latest expanded session:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T165818402Z`
- Expanded session-level results:
  - `kalshiContracts: 359`
  - `semanticAuditFindings: 0`
  - `anchorInputAuditFindings: 0`
  - `btcAnchorMappings: 250`
  - `rawAnchorProbabilities: 250`
- Expanded residual-layer results:
  - `mappedAnchors: 250`
  - `diagnosticRows: 250`
  - `observationsBuilt: 0`
  - `tradableObservations: 0`
  - `nonTradableAnchors: 250`
  - inactive reason breakdown:
    - `pre_open_market: 250`
- Interpretation:
  - the missing breadth issue is materially reduced at the BTC-series level rather than only a single retained family
  - the remaining blocker for real external-anchor testing on this live slice is market state, not anchor coverage
  - the latest capture now holds the discovered BTC families in-series rather than just the single largest family
  - a deeper direct venue scan plus the latest full-series capture both indicate the BTC families visible in the live series snapshot are still `initialized` / pre-open, so the no-trade result appears to be a venue-state fact rather than a shallow capture artifact
- Practical interpretation:
  - the current BTC external-anchor sleeve is now honest enough to reject bad evidence instead of manufacturing weak backtests
  - the next edge, if any, depends on either better quote quality / depth or a richer capture cadence rather than looser filtering

## 2026-08-16 Internal-consistency scorecard layer and refreshed live slice

- Added a new reproducible internal-consistency experiment / scorecard pipeline:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/internal-consistency-experiment-runner.ts`
  - CLI: `npm run run:internal-consistency-experiments`
- Widened the live-capture simulation layer so internal-consistency simulations now run across the full observation set under all three execution templates rather than a tiny aggressive-only fragment.
- Latest refreshed end-to-end slice:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T170905790Z`
- Refreshed slice headline outputs:
  - `kalshiContracts: 359`
  - `semanticAuditFindings: 0`
  - `anchorInputAuditFindings: 0`
  - `btcAnchorMappings: 250`
  - `rawAnchorProbabilities: 250`
- BTC external-anchor status on the refreshed slice:
  - `mappedAnchors: 250`
  - `diagnosticRows: 250`
  - `observationsBuilt: 250`
  - `tradableObservations: 0`
  - `nonTradableAnchors: 250`
  - inactive reason:
    - `pre_open_market: 250`
- Internal-consistency scorecard output:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T170905790Z/summaries/internal-consistency-scorecard.json`
- Internal-consistency baseline readout on that slice:
  - `observations: 377`
  - `simulations: 1131`
  - edge mix:
    - `temporal_nested: 269`
    - `threshold_monotone: 108`
  - hardness mix:
    - `conditional: 269`
    - `hard: 108`
  - structural opportunity:
    - `grossPositive: 64`
    - `feeAdjustedPositive: 1`
    - `depthAdjustedPositive: 1`
- Current interpretation:
  - the stack now has a real internal-consistency scorecard layer rather than just raw observation rows plus a toy simulation subset
  - the refreshed live slice is still better for honest measurement than for claiming alpha: the BTC sleeve remains pre-open, and the internal-consistency sleeve is still mostly friction-negative under the current deterministic baseline
- Immediate remaining frontier after this step:
  - improve internal-consistency economic realism and family-specific diagnostics
  - obtain tradable BTC live slices before taking any external-anchor economic result seriously

## 2026-08-16 Stricter internal-consistency honesty pass

- Tightened the observation and simulation layers again so the internal-consistency sleeve stops overstating execution cleanliness:
  - placeholder fee-model usage now surfaces in observation quality flags
  - theoretical target substitution is now flagged explicitly
  - execution-safe status is no longer auto-granted when the fee model is only placeholder-level
  - template economics now change with the chosen execution template rather than only changing reported fill/slippage fields
- Latest stricter rerun:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T171250249Z`
- Latest stricter external-anchor status:
  - still `250` mapped BTC anchors
  - still `0` tradable observations
  - still entirely `pre_open_market`
- Latest stricter internal-consistency scorecard:
  - `observations: 377`
  - `simulations: 1131`
  - `semanticSafeObservations: 377`
  - `executionSafeObservations: 0`
  - `observationsWithQualityFlags: 377`
  - template economics now separate:
    - `aggressive_all_legs` mean PnL to resolution about `-1.35`
    - `hybrid_edge_tiered` mean PnL to resolution about `-1.03`
    - `passive_first` mean PnL to resolution about `-0.81`
- Current research interpretation:
  - the internal-consistency sleeve is now materially more honest about the fact that fee/execution modeling is still placeholder-heavy
  - passive-first currently looks least bad under the deterministic baseline, but the sleeve is still negative overall on this slice
  - the BTC external-anchor sleeve remains blocked by venue state rather than by mapping breadth

## 2026-08-16 Threshold-monotonicity graph fix

- Fixed a real semantic graph bug in:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/modules/module-4-graph.ts`
- Threshold-ladder grouping now includes:
  - `evaluationTimestampMs`
  - `referencePriceDefinition`
  in addition to variable / timezone / operator family.
- This prevents false `threshold_monotone` edges across different expiries / settlement times that happen to share the same threshold value.
- Latest post-fix rerun:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T171759450Z`
- Post-fix internal-consistency readout:
  - `observations: 370`
  - `simulations: 1110`
  - `threshold_monotone` observations reduced from `108` to `101`
  - `hard` observations reduced from `108` to `101`
- Post-fix interpretation:
  - the internal-consistency slice is materially cleaner semantically than the prior strict run
  - the remaining dominant internal limitation is placeholder fee / execution modeling, not graph contamination

## 2026-08-16 Execution realism and tradable-only capture pass

- Advanced the stack materially on three fronts:
  - live capture is now tradable-only by default at the series-selection boundary
  - quote-state construction now uses the real top of book from the ticker feed instead of reading the worst bid from unsorted depth arrays
  - internal-consistency simulations now run only on `executionSafe` observations rather than on every observed edge
- Key files updated in this pass:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/modules/module-5-state-views.ts`
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/modules/module-6-observations.ts`
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/modules/module-8-simulation.ts`
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/kalshi-live-capture.ts`
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/internal-consistency-experiment-runner.ts`
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/semantic-audit.ts`
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/btc-anchor-residuals.ts`
- Latest full rerun root:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T182628325Z`
- Latest internal-consistency state on that root:
  - `observations: 231`
  - `executionSafeObservations: 3`
  - `internal simulations: 9`
  - `simulationCoverage.expectedSimulations: 9`
  - `simulationCoverage.actualSimulations: 9`
  - execution scorecard now reflects only the `3` execution-safe observations instead of all `231`
- Latest external-anchor state on that root:
  - `KXBTC` scanned candidates: `250`
  - selected tradable candidates: `0`
  - `mappedAnchors: 0`
  - `coverageStatus: "no_anchor_contracts_captured"`
  - blocker reason:
    - `No tradable BTC contracts were captured for the current slice, so the anchor sleeve has no evaluable coverage.`
- Latest semantic-audit output now honestly surfaces the two real blockers:
  - the requested BTC target series had no tradable candidates in the live window
  - the BTC anchor sleeve therefore has no contract coverage in this slice
  - all internal observations are still flagged, so the slice is not yet decision-ready
- Current interpretation:
  - the internal-consistency sleeve is now much more honest than before: economics are no longer being reported on the full observed set, only on the tiny execution-admissible subset
  - the BTC external-anchor sleeve is now blocked by live venue state rather than by silent pipeline contamination
  - the next frontier is no longer basic plumbing; it is deciding whether to wait for live tradable BTC contracts, switch the external-anchor sleeve to another family temporarily, or continue deepening the internal-consistency sleeve alone

## 2026-08-16 BTC readiness audit and cleaner slice diagnostics

- Added an explicit BTC market-readiness audit so the system can distinguish:
  - `tradable_ready`
  - `pre_open`
  - `live_but_empty`
  - `inactive`
  at the event-family level instead of failing with a vague zero-coverage result.
- New file added:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/btc-market-readiness-audit.ts`
- Also refined observation quality handling:
  - fee-model metadata is no longer injected as a universal quality flag on every internal observation
  - the readiness audit now infers the BTC series correctly from `event_ticker` / page context instead of relying on a missing `series_ticker` field inside each saved market row
- Latest full rerun root after these fixes:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T192823632Z`
- Latest BTC readiness result on that root:
  - `visibleFamilies: 2`
  - `tradableFamilies: 0`
  - `nextOpenFamily: KXBTC-26AUG1723`
  - `nextOpenTimeMs: 1787018400000`
  - family details:
    - `KXBTC-26AUG1723`: `62` contracts, all `initialized`, all `pre_open`, zero liquidity/volume
    - `KXBTC-26AUG1800`: `188` contracts, all `initialized`, all `pre_open`, zero liquidity/volume
- Latest internal-consistency state on that root:
  - `observations: 231`
  - `executionSafeObservations: 3`
  - `simulations: 9`
  - `coverageComplete: true`
  - `observationsWithQualityFlags: 230`
  - `flaggedObservationRate` fell slightly below the prior artificial `100%` level and is now `~99.57%`
- Latest semantic-audit state on that root:
  - it now reports the BTC blocker with concrete evidence:
    - target series skipped because `tradableCandidates: 0`
    - `nextOpenFamily` and `nextOpenTimeMs` included in the finding
  - it also reports:
    - `anchor_slice_without_contract_coverage`
    with the same next-open evidence
- Current interpretation:
  - this is now the correct operational diagnosis for the BTC sleeve:
    - the issue is not low volume in already-open BTC contracts
    - the issue is that the visible BTC families in the current Kalshi slice are not open for trading yet
  - the internal-consistency sleeve is materially cleaner and more honest than before, but still highly selective on what qualifies as execution-safe
  - the proper next move is to build around readiness-aware scheduling / family selection for BTC rather than forcing evaluation on non-live contracts

## 2026-08-16 Independent phase review outcome

- An independent review pass on the latest root confirmed:
  - no new blocker-grade code bug remains in the current internal-consistency path
  - the remaining blocker is genuine market availability for the BTC sleeve
- Reviewed latest root:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T192823632Z`
- Review conclusion:
  - the BTC external-anchor phase cannot advance on this slice because `KXBTC` had `0` tradable candidates, so the sleeve correctly produced:
    - `mappedAnchors: 0`
    - `coverageStatus: "no_anchor_contracts_captured"`
  - this is now an honest operational blocker, not a silent semantic or reporting bug
- Practical implication:
  - to advance the BTC sleeve meaningfully, the next run must happen in a window where a BTC family is actually open and tradable
  - the internal-consistency sleeve can continue improving in parallel, but the BTC sleeve now needs either:
    - readiness-aware waiting / scheduled capture around the next open family
    - or a deliberate venue / family pivot if we want continuous crypto-linked tradability instead of Kalshi-timed windows

## 2026-08-16 BTC capture-window planner and pre-open short-circuit

- Added a dedicated capture-window planner:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/btc-capture-window-plan.ts`
- Added npm entrypoint:
  - `plan:btc-capture-window`
- Session wrapper improvements:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/btc-observation-session.ts`
  - session summary now includes:
    - `btcCaptureAction`
    - `btcNextOpenFamily`
    - `btcNextOpenTimeIso`
    - `btcRecommendedCaptureStartIso`
    - `btcRecommendedCaptureEndIso`
    - `btcAnchorStageStatus`
  - if BTC is pre-open / not tradable, the session now:
    - skips Coinbase / Deribit / anchor-mapping work
    - returns a clean `skipped_pre_open` status instead of doing pointless anchor work
- Latest session root after planner/short-circuit pass:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260816T194330976Z`
- Latest BTC session summary on that root:
  - `btcTradableFamilies: 0`
  - `btcCaptureAction: "wait_for_open"`
  - `btcNextOpenFamily: "KXBTC-26AUG1723"`
  - `btcNextOpenTimeIso: "2026-08-18T02:00:00.000Z"`
  - `btcRecommendedCaptureStartIso: "2026-08-18T02:05:00.000Z"`
  - `btcRecommendedCaptureEndIso: "2026-08-18T04:05:00.000Z"`
  - `btcAnchorStageStatus: "skipped_pre_open"`
- Current interpretation:
  - this is the first fully operational answer for the BTC sleeve
  - the proper next run is no longer ambiguous:
    - start shortly after the next BTC family opens
    - monitor for roughly two hours while tradable quotes form
  - this is a materially cleaner solution than forcing external-anchor work on pre-open contracts

## 2026-08-16 Reserve venue pivot research for BTC external-anchor

- Public venue checks performed:
  - Kalshi `KXBTC` discovery currently shows visible BTC families, but all sampled families in the current window are still `initialized` / pre-open
  - Polymarket public event data currently shows live BTC-related events, but not the same short-horizon terminal threshold family structure as Kalshi
- Most useful reserve-path finding:
  - Polymarket currently has an active BTC milestone event:
    - `when-will-bitcoin-hit-150k`
  - This event contains a ladder of contracts such as:
    - `Will Bitcoin hit $150k by September 30?`
    - `... by December 31?`
    - `... by March 31, 2026?`
    - `... by December 31, 2026?`
  - The live contract is continuously tradable and uses Binance one-minute candle highs as the resolution source
- Important interpretation:
  - this is **not** the same semantic object as the Kalshi BTC family
  - Kalshi BTC sleeve:
    - terminal / settlement-time threshold distribution
  - Polymarket BTC milestone sleeve:
    - first-passage / hitting-time probability
- Why this matters:
  - it is a **clean pivot**, not a hack
  - it preserves the core BTC external-anchor concept while switching from:
    - `P(S_T > K)` / bucket probabilities
    to:
    - `P(max_{t<=T} S_t >= K)`
  - the model stack would therefore change from terminal-distribution anchoring toward barrier / hitting-probability anchoring
- Current strategic conclusion:
  - **primary path:** keep Kalshi BTC external-anchor and use readiness-aware scheduled capture around live openings
  - **reserve path:** build a second BTC external-anchor sleeve for continuously tradable milestone-by-date contracts on Polymarket if we want ongoing crypto-linked live evaluation even when Kalshi BTC is pre-open
- Durable memo saved to Vault:
  - `/Users/canozgel-macmini/.openclaw/MissionControlVault/10 Research/Prediction Markets/prediction-markets-btc-external-anchor-live-path-decision-2026-08-16.md`

## 2026-08-20 BTC paper-trading loop scaffold

- Added a persistent BTC paper-trading loop on top of the existing Kalshi live-capture and BTC anchor stack:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/btc-paper-trading-loop.ts`
- Added exports and CLI wiring:
  - `npm run run:btc-paper-loop`
  - updated:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/index.ts`
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/package.json`
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/README.md`
- The loop currently does the following in one run:
  - starts a fresh BTC observation session unless an `outputRoot` is supplied
  - short-circuits cleanly when BTC families are still pre-open
  - builds external-anchor residual observations once anchor inputs exist
  - runs a baseline hybrid execution experiment slice
  - maintains a persistent paper portfolio and loop journal under:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/btc-anchor`
  - records:
    - entries
    - exits
    - holds
    - cash
    - realized PnL
    - unrealized PnL
    - net liquidation
- First live paper-loop results:
  - run command:
    - `npm run run:btc-paper-loop`
  - latest replay root:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/kalshi-live/20260820T091340708Z`
  - latest paper-loop summary:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/btc-anchor/latest-summary.json`
  - latest portfolio state:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/btc-anchor/portfolio-state.json`
  - result:
    - `btcCaptureAction: "wait_for_open"`
    - `entriesPlaced: 0`
    - `openPositions: 0`
    - `cashCents: 100000`
    - `netLiquidationCents: 100000`
    - skipped because current visible BTC families are still pre-open
- Latest readiness window from the generated planner:
  - next open family:
    - `KXBTC-26AUG2123`
  - next open time:
    - `2026-08-22T02:00:00.000Z`
  - recommended capture start:
    - `2026-08-22T02:05:00.000Z`
  - recommended capture end:
    - `2026-08-22T04:05:00.000Z`
- Immediate next step:
  - trigger the BTC paper loop automatically shortly after the recommended capture start so the first real paper fills can happen when live tradable quotes exist

## 2026-08-20 Paper performance metrics layer

- Extended the BTC paper-trading loop so each run now writes performance analytics, not just action logs:
  - cumulative return
  - realized return
  - unrealized return
  - loop-level Sharpe
  - loop-level Sortino when downside returns exist
  - max drawdown
  - turnover ratio
  - gross / net exposure
  - win rate, profit factor, and holding-time stats once trades actually close
- The loop summary now also records per-run:
  - `entryNotionalCents`
  - `exitNotionalCents`
  - `grossTradedNotionalCents`
  - `grossExposureCents`
  - `netExposureCents`
  - `grossExposureRate`
  - `netExposureRate`
- New durable output:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/btc-anchor/performance-summary.json`
- Latest verified state after the metrics pass:
  - latest paper summary:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/btc-anchor/latest-summary.json`
  - current performance snapshot:
    - `loopCount: 4`
    - `cumulativeReturn: 0`
    - `loopSharpeRatio: 0`
    - `maxDrawdown: 0`
    - `turnoverRatio: 0`
  - interpretation:
    - the metrics layer is working
    - values are still zero because BTC families have remained pre-open, so no paper entries or exits have happened yet

## 2026-08-20 Reserve-path promotion: Polymarket BTC milestone scan

- Added a live reserve-path scanner for continuously tradable BTC milestone markets on Polymarket:
  - runtime client:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/runtime/polymarket-api.ts`
  - pipeline:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-milestone-scan.ts`
  - CLI:
    - `npm run scan:polymarket-btc`
- The scanner writes a durable output under:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/polymarket-live/`
- First live verified scan result:
  - latest root:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/polymarket-live/20260820T132645863Z`
  - verdict:
    - `viable_public_data_with_restriction_risk`
  - primary recommendation:
    - `Use Polymarket as the always-on research and paper-trading reserve path, but treat venue/jurisdiction restrictions as a production gating item.`
  - strongest currently live market found:
    - event:
      - `When will Bitcoin hit $150k?`
    - market:
      - `Will Bitcoin hit $150k by December 31, 2026?`
    - live fields at scan time:
      - `bestBid: 0.023`
      - `bestAsk: 0.024`
      - `spread: 0.001`
      - `volume24hr: 21630.786272999998`
      - `liquidityNum: 88632.44849`
      - `acceptingOrders: true`
      - `enableOrderBook: true`
- Strategic conclusion changed materially:
  - it no longer makes sense to treat Kalshi BTC pre-open timing as the only path for an always-on BTC sleeve
  - the better architecture is:
    - `Kalshi BTC terminal-threshold sleeve` for clean regulated settlement semantics when open
    - `Polymarket BTC milestone sleeve` for always-on research and paper-trading continuity
    - a venue-agnostic BTC probability engine underneath both, with separate payoff translators:
      - terminal threshold probability for Kalshi
      - first-passage / barrier-hit probability for Polymarket milestone markets
- Production caveat:
  - the current live Polymarket path appears usable for public-data research and paper trading immediately
  - real-money production use remains gated by venue restriction / compliance / jurisdiction review rather than by data availability
- Immediate next build priority:
  - stop treating `wait_for_open` as the only operational answer
  - add a second paper-trading loop for the Polymarket milestone sleeve so the BTC program can keep learning even when Kalshi is unavailable

## 2026-08-20 Polymarket BTC milestone paper loop

- Added the second BTC reserve-sleeve paper loop:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-paper-loop.ts`
- Added CLI:
  - `npm run run:polymarket-btc-paper-loop`
- What it currently does:
  - runs the live Polymarket BTC milestone scan
  - pulls live Coinbase BTC spot
  - computes a crude first-passage / barrier-hit anchor probability under a simple vol assumption
  - compares that anchor to live Polymarket mid prices
  - manages a persistent paper portfolio under:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/polymarket-btc-milestone`
  - writes the same style of performance summary used by the Kalshi paper loop
  - surfaces `topSignals` so the reserve sleeve can explain why it did or did not trade
- First live verified loop result:
  - latest root:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/polymarket-live/20260820T133413580Z`
  - latest best market:
    - `will-bitcoin-hit-150k-by-december-31-2026`
  - live inputs at the last verified run:
    - `spotPrice: 71590.55`
    - `marketMid: 0.0235`
    - `anchorProbability: 0.04154695080372406`
    - `signal: 0.01804695080372406`
    - recommended side from the crude anchor:
      - `yes`
  - result:
    - `eligibleEntries: 0`
    - `entriesPlaced: 0`
    - no paper trade yet because the signal did not clear the default entry threshold of `0.04`
- Interpretation:
  - this is no longer a venue-availability blocker
  - it is now a model / threshold question:
    - the market is live
    - the reserve sleeve can observe and score it continuously
    - the current first-pass barrier model sees a positive edge, but not large enough yet to justify entry under the initial guardrails
- Better framing going forward:
  - Kalshi BTC is the clean terminal-threshold sleeve
  - Polymarket BTC milestone is the always-on barrier-hit sleeve
  - the blocker has moved from `data availability` to `signal quality / deployment policy`, which is a much healthier place to be

## 2026-08-20 Historical barrier backtest

- Added a research-grounded historical validation pipeline:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/src/pipelines/polymarket-btc-barrier-backtest.ts`
- Added CLI:
  - `npm run backtest:polymarket-btc-barrier`
- Scope:
  - pulls daily BTC candles from Coinbase
  - builds synthetic milestone / barrier-hit observations across multiple horizons and barrier multipliers
  - compares three models on a held-out set:
    - raw first-passage barrier probability
    - isotonic-calibrated barrier probability
    - terminal-only baseline probability
- Latest verified run output:
  - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/backtests/polymarket-btc-barrier/20260820T134713906Z/summaries/barrier-backtest-summary.json`
- Dataset:
  - candles: `2058`
  - observations: `44682`
  - train: `31277`
  - test: `13405`
- Held-out overall metrics:
  - raw barrier:
    - `Brier 0.1009`
    - `log loss 0.3222`
    - `mean prediction 0.3241`
  - calibrated barrier:
    - `Brier 0.1077`
    - `log loss 0.3519`
    - `mean prediction 0.3731`
  - terminal baseline:
    - `Brier 0.1778`
    - `log loss 0.5003`
    - `mean prediction 0.1361`
- Main conclusion:
  - the raw first-passage barrier model materially outperforms the terminal-only baseline out of sample
  - the isotonic calibration pass degrades performance in this sample and should not be promoted blindly
- Segment takeaways:
  - raw barrier wins cleanly across `30d`, `90d`, `180d`, and `365d` horizons
  - raw barrier is especially strong for closer milestone levels like `1.05x`, `1.10x`, and `1.25x`
  - for very far barriers like `2.00x`, the terminal baseline can slightly outperform because the true event rate is extremely low
- Trading-readiness implication:
  - the always-on Polymarket reserve sleeve is now supported by a credible historical model-quality backtest
  - the next bottleneck is threshold selection, calibration discipline, and live quote-to-fair mapping, not access to BTC external data
- Follow-through implementation:
  - the Polymarket paper loop now consumes the latest historical barrier-backtest summary and applies a segment-aware gate rather than one blunt global threshold
  - strong / medium / cautious historical segments get tighter entry thresholds
  - segments that underperform the terminal baseline are blocked entirely
- Latest live verdict under the new gate:
  - market: `will-bitcoin-hit-150k-by-december-31-2026`
  - live signal: about `+2.08%` on the `yes` side
  - barrier multiplier: about `2.07x`
  - horizon: about `134` days
  - policy result: `blocked`
  - interpretation:
    - the system is now declining this market for a research-backed reason, not because the venue is unavailable or because a fixed threshold happened to be too high
- Follow-up universe expansion:
  - widened the Polymarket scanner to paginate through the Gamma API instead of only reading the first event page
  - widened BTC coverage beyond the `150k hit` family into the live `What price will Bitcoin hit in 2026?` family
  - updated the reserve sleeve so it can score both upside `reach` barriers and downside `dip` barriers
- Latest live run after the universe expansion:
  - scan now sees `1000` active events, `3` matching BTC event families, `53` matching BTC markets, and `34` quote-ready BTC markets
  - the live sleeve shifted from a single weak far-out contract into nearer thresholds where the backtest is strongest
  - first live entries placed:
    - `will-bitcoin-reach-85000-by-december-31-2026-from-june-8`
    - `will-bitcoin-reach-90000-by-december-31-2026-113-862-581-343`
    - `will-bitcoin-reach-95000-by-december-31-2026-from-june-8`
    - `will-bitcoin-reach-100000-by-december-31-2026-571-361-361`
  - top live signal examples:
    - `85k`: anchor about `65.99%` vs market mid about `42.0%`
    - `90k`: anchor about `55.01%` vs market mid about `30.5%`
    - `95k`: anchor about `45.53%` vs market mid about `22.5%`
    - `100k`: anchor about `37.45%` vs market mid about `15.5%`
  - immediate paper result:
    - `entriesPlaced: 4`
    - `openPositions: 4`
    - `grossExposureCents: 49658`
    - `unrealizedPnlCents: -290` right after entry, consistent with paying the spread
- Follow-up risk and research hardening:
  - added ladder-aware correlation controls to the live reserve sleeve
  - the loop now caps same-event exposure and same-direction position count, and requires minimum barrier spacing before adding another threshold in the same family
  - added a quant-style research snapshot to the runtime summary with:
    - regime state
    - candidate-book composition
    - portfolio concentration
- Latest control outcome:
  - next live loop saw `15` still-eligible entries but placed `0` new trades because the existing BTC threshold ladder already consumed the allowed family exposure
  - current concentration snapshot from the runtime summary:
    - `quoteReadyMarkets: 34`
    - `upsideQuoteReadyMarkets: 20`
    - `downsideQuoteReadyMarkets: 12`
    - `allowedEntries: 13`
    - `largestEventExposureRate: 24.989%`
    - `largestDirectionExposureRate: 24.989%`
  - interpretation:
    - the sleeve is now behaving more like a real research portfolio and less like a naive top-signal stacker
- Added the next quant-research layer:
  - persisted a dedicated research artifact at:
    - `/Users/canozgel-macmini/.openclaw/workspace/prediction-markets-stack/data/paper-trading/polymarket-btc-milestone/research-summary.json`
  - added regime tagging from recent Coinbase candles:
    - `realizedVol20d`
    - `momentum20d`
    - `momentum60d`
    - `volBucket`
    - `trendBucket`
  - added candidate-book diagnostics:
    - gross edge to mid
    - net edge to entry
    - average spread cost
  - added attribution cuts:
    - by direction
    - by barrier bucket
    - by horizon bucket
    - by event
  - added overlap-adjusted sizing on top of the hard caps so overlap can reduce trade size before the family-level cap fully blocks new entries
- Latest persisted research snapshot highlights:
  - regime:
    - `volBucket: low`
    - `trendBucket: up`
    - `realizedVol20d: 0.3752`
    - `momentum20d: 15.62%`
  - candidate book:
    - `allowedEntries: 20`
    - `blockedEntries: 12`
    - `averageGrossEdgeToMid: 10.18%`
    - `averageNetEdgeToEntry: 9.80%`
    - `averageSpreadCost: 0.395%`
  - attribution:
    - all current open risk still sits in the `yes` bucket
    - current barrier bucket is `<=100000`
    - current horizon bucket is `<=180 days`
