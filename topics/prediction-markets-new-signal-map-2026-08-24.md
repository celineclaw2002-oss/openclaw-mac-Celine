# Prediction Markets New Signal Map - 2026-08-24

## Summary

This pass re-evaluated prediction-market alpha ideas after the current `BTC milestone` sleeve was blocked and the `KXFED internal-consistency` result proved too thin.

The main conclusion:

- there are still credible prediction-market alpha directions worth exploring
- but the best next ideas are **not** generic price prediction
- the strongest ideas come from structural frictions:
  - semantic non-fungibility across venues
  - domain / horizon calibration bias
  - event-time repricing lag versus stronger outside markets
  - resolution-rule ambiguity
  - liquidity incentive distortions
  - short-horizon order-flow effects

## Highest-conviction signal shortlist

### 1. Cross-venue semantic non-fungibility / law-of-one-price violations

- Why it may exist:
  - identical or near-identical events do not net across venues
  - semantic mismatch, resolution mismatch, capital lockup, and venue frictions keep spreads open
- Best evidence:
  - `Semantic Non-Fungibility and Violations of the Law of One Price in Prediction Markets` (`2026`) reports persistent execution-aware price deviations of roughly `2-4%` on matched events across venues
  - SSRN `Price Discovery and Trading in Prediction Markets` (`2025`) reports persistent cross-platform disparities and order-imbalance predictiveness
- What would kill it:
  - once exact rule matching and execution costs are applied, the spread disappears
  - basis risk from mismatched resolution criteria dominates the apparent edge
- Required data:
  - exact contract-rule normalization
  - quote and depth histories across venues
  - explicit execution and capital-lock modeling

### 2. Domain / horizon calibration bias and favorite-longshot effects

- Why it may exist:
  - prices are not equally calibrated across domains, horizons, and trade sizes
  - some market classes are systematically too close to `50`, others too extreme
- Best evidence:
  - `Decomposing Crowd Wisdom: Domain-Specific Calibration Dynamics in Prediction Markets` (`2026`) using hundreds of millions of trades across Kalshi and Polymarket
  - `Makers and Takers: The Economics of the Kalshi Prediction Market` / VoxEU summary (`2026`) shows favorite-longshot bias and stronger losses for takers on longshots
  - `Calibration in Prediction Markets: Theory and Evidence` (`Kalshi Research`, `2026`) suggests strong overall calibration near resolution but meaningful category and timing variation
- What would kill it:
  - after conditioning on domain, horizon, liquidity, and execution side, the residual bias is too small to monetize
  - the bias only exists in low-liquidity names where fills are not realistic
- Required data:
  - resolved market history
  - category tags
  - time-to-resolution snapshots
  - maker/taker classification or strong proxy

### 3. Event-time repricing lag versus stronger outside markets

- Why it may exist:
  - macro and rates-linked prediction contracts can lag futures, options, and nowcast data
  - institutional markets may lead retail-heavy prediction venues around releases
- Best evidence:
  - Fed paper `Kalshi and the Rise of Macro Markets` (`2026`)
  - local research already identified `Kuttner`, `Gurkaynak/Sack/Swanson`, `Giannone/Reichlin/Banbura`
  - external examples suggest CME / rates markets can lead prediction-market repricing on FOMC-style questions
- What would kill it:
  - prediction venues already adjust inside the same latency window once costs are included
  - available prediction-market liquidity is too poor exactly when the information advantage matters
- Required data:
  - live release timestamps
  - rates futures / OIS / fed funds or macro nowcast inputs
  - synchronized prediction-market quote histories

### 4. Resolution-rule and design edge

- Why it may exist:
  - similar headlines often resolve under different sources, deadlines, or ambiguity clauses
  - markets with weak wording can trade as if they represent a simpler proposition than they legally do
- Best evidence:
  - this is strongly supported by venue mechanics and contract structure rather than one dominant academic paper
  - official and industry documentation repeatedly stress source, timing, and dispute-path differences across Kalshi and Polymarket
- What would kill it:
  - after exact rule parsing, few scalable opportunities remain
  - ambiguity is too idiosyncratic and too infrequent to support a systematic sleeve
- Required data:
  - full rule texts
  - resolution sources
  - dispute history
  - comment / clarification changes when available

### 5. Liquidity-incentive and maker-structure distortions

- Why it may exist:
  - venues like Polymarket explicitly subsidize specific quoting behavior
  - rewards, rebates, and negative-risk mechanics can create non-informational order placement
- Best evidence:
  - Polymarket liquidity-reward documentation
  - `Who Wins and Who Loses in Prediction Markets? Evidence from Polymarket` (`2026`) shows strong maker/taker performance separation
  - `The Ghosts of Polymarket` (`2026`) suggests hybrid execution quirks can interact with reward systems and create exploitable distortions
- What would kill it:
  - edge belongs mostly to industrial market makers with better infra
  - reward capture is offset by adverse selection and inventory risk
- Required data:
  - reward schedules
  - order-book histories
  - maker/taker flags or proxies
  - fill and inventory accounting

### 6. Intra-market rebalancing and combinatorial arbitrage

- Why it may exist:
  - single-market `YES + NO != 1`
  - related outcome sets and condition trees can violate additivity
- Best evidence:
  - `Unravelling the Probabilistic Forest: Arbitrage in Prediction Markets` reports large realized extraction on Polymarket from market-rebalancing and combinatorial structures
- What would kill it:
  - extraction windows are too short and too crowded
  - execution, inventory, or legging frictions eat the apparent edge
- Required data:
  - condition trees
  - exact outcome mapping
  - high-frequency quotes and fills

### 7. Short-horizon order-flow / whale / queue signals

- Why it may exist:
  - order imbalance and large informed flow can lead future price moves
  - thin event books may adjust slowly after aggressive informed prints
- Best evidence:
  - SSRN `Price Discovery and Trading in Prediction Markets` (`2025`) finds whale order imbalances predictive in election markets
  - Polymarket microstructure research (`Dubach`, `2026`) provides strong caution and structure for how to do this correctly
  - LOB literature from `Cont`, `Cartea`, `Kolm/Turiel/Westray` transfers well
- What would kill it:
  - signal depends on bad trade-direction inference
  - latency and queue position make the signal untradeable
- Required data:
  - authoritative aggressor direction
  - full order-book events
  - low-latency timestamping

## My final ranking now

1. `Resolution-rule / semantic dislocations`
2. `Event-time repricing lag versus stronger outside markets`
3. `Liquidity-incentive and maker-structure distortions`
4. `Domain / horizon calibration bias`
5. `Short-horizon order-book / queue signals`
6. `Cross-venue semantic non-fungibility`
7. `Intra-market combinatorial arbitrage`

## Why this ranking

- `1-4` have the best mix of:
  - strong structural reason for persistence
  - explicit research support
  - clearer test design
  - plausible path to repeatable alpha
- `5-7` can be real, but are easier to overstate or harder to scale cleanly

## Best first build from here

### First choice

- `Cross-venue semantic non-fungibility`
- Build:
  - exact rule normalizer
  - event identity matcher
  - basis-risk filter
  - friction-aware spread monitor

### Second choice

- `Domain / horizon calibration bias`
- Build:
  - resolved snapshot panel
  - domain-horizon calibration tables
  - maker/taker split if feasible
  - confidence-aware fair-value adjustment rather than naive raw price usage

### Third choice

- `Event-time repricing lag`
- Build:
  - one narrow family only, ideally `Fed` or `CPI`
  - synchronized external anchor plus prediction-market timestamps
  - latency-aware tradeability study

## Fast kill criteria

### Cross-venue semantic non-fungibility

- kill if exact rule matching plus execution costs reduce spreads below a durable monetizable threshold
- kill if apparent spreads are mostly fake arbitrage from differing deadlines or sources

### Domain / horizon calibration bias

- kill if post-conditioning residual bias is too small to survive spread and fees
- kill if the effect only appears in dead markets

### Event-time repricing lag

- kill if outside markets lead only by milliseconds we cannot use
- kill if the best families have no repeatable fillable lag

### Liquidity-incentive distortions

- kill if reward farming edge is already absorbed by specialist makers
- kill if inventory costs dominate rewards and rebates

### Resolution-rule edge

- kill if opportunities are too sparse and discretionary
- kill if it cannot be encoded into a repeatable screening rule

### Order-flow / whale signals

- kill if direction-quality and latency are insufficient
- kill if queue loss erases the alpha

## Recommended next action

If choosing one new direction to build now, the best candidate is:

- `resolution-rule / semantic dislocations with exact contract parsing and ambiguity screening`

If choosing a second in parallel:

- `event-time repricing on one narrow macro family such as Fed or CPI`

## Final stance

- do **not** keep forcing the current `BTC barrier` path
- the evidence is too synthetic and too weak to justify more model-complexity spend there right now
- the better use of research budget is to pivot toward structural alpha families where market design, wording, timing, or microstructure can create persistent edge
- best current build order:
  - `resolution-rule / semantic dislocations`
  - `event-time repricing`
  - `liquidity / reward distortions`
  - `domain / horizon calibration overlays`
