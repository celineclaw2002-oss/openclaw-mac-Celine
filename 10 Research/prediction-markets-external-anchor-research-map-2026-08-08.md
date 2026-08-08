---
title: External-Anchor Research Map for Prediction Markets
created: 2026-08-08
updated: 2026-08-08
status: active
domain: trading
type: research
visibility: internal
---

# External-Anchor Research Map for Prediction Markets

## Purpose

This memo identifies named researchers, seminal papers, and transferable model ideas for building an external-anchor prediction stack for Kalshi and Polymarket.

The practical goal is not to find "the true probability" in the abstract. It is to identify outside markets and statistical models that can generate a cleaner benchmark for specific event contracts than the prediction market itself.

## Leaders

### Option-implied probabilities and state-price densities

- **Douglas Breeden** and **Robert Litzenberger**: foundational state-price-density extraction from option prices. Their framework is still the clean starting point for mapping options into binary threshold probabilities.
- **Mark Rubinstein**: turned the state-price idea into implementable implied-tree methods. Important if we want strike-by-strike consistency rather than a crude one-strike heuristic.
- **Jens Jackwerth**: core figure in recovering implied distributions from options and thinking carefully about what can and cannot be inferred from market prices.
- **Yacine Ait-Sahalia**: major statistical-finance leader on nonparametric estimation of state-price densities and shape-restricted option extraction.
- **Peter Carr** and **Dilip Madan**: important for the replication mindset around digitals, static option portfolios, and no-arbitrage translation from option surfaces into event payoffs.
- **David Bates**: classic work using options to infer crash probabilities and tail-event expectations before realized outcomes.
- **Robert Bliss**, **Nikolaos Panigirtzoglou**, **Peter Hordahl**, and **Allan Malz**: practical work on extracting and interpreting risk-neutral densities, tails, and risk premia.
- **Zhaogang Song** and **Dacheng Xiu**: more recent state-price-density work, useful as a reminder that different option markets can imply different densities and that the extraction layer itself needs model discipline.

### Prediction markets and event forecasting from market data

- **Justin Wolfers** and **Eric Zitzewitz**: the most important names for interpreting prediction-market prices as probabilities, understanding favorite-longshot style distortions, and treating market prices as noisy beliefs rather than oracles.
- **Andrew Leigh**: useful for event-probability identification from market prices in the Iraq-war work with Wolfers and Zitzewitz.
- **David Rothschild** is worth knowing as a later applied prediction-market forecasting name, though the foundational theory still runs through Wolfers and Zitzewitz.

### Macro, rates, and threshold-event forecasting

- **Kenneth Kuttner**: seminal on extracting monetary-policy surprises from fed funds futures. Extremely relevant for Fed-linked Kalshi contracts.
- **Refet Gurkaynak**, **Brian Sack**, and **Eric Swanson**: central figures in translating interest-rate-market moves into policy information and separating target surprises from path surprises.
- **Arturo Estrella** and **Frederic Mishkin**: canonical names for using the yield curve and related financial variables to forecast recession-style threshold events.
- **Domenico Giannone**, **Lucrezia Reichlin**, **Marta Banbura**, and **Michele Modugno**: the modern nowcasting school. Essential for moving from high-frequency macro data flow to probability distributions over releases.
- **Tobias Adrian** and **Nina Boyarchenko**: key names for growth-at-risk / vulnerable-growth style models that translate financial conditions into downside-event probabilities.

## Important Papers

The list below is deliberately selective and biased toward papers that transfer into an external-anchor research program.

### Core state-price / option-implied probability papers

1. **Breeden, D. and Litzenberger, R. (1978), "Prices of State-Contingent Claims Implicit in Option Prices."**
Why it matters: the root result. The second derivative of option prices across strike recovers the risk-neutral density, which is exactly the object needed for threshold-event probabilities.

2. **Rubinstein, M. (1994), "Implied Binomial Trees."**
Why it matters: shows how to recover a full implied terminal distribution consistent with observed option prices. Good inspiration for ladder-style event markets and monotone threshold families.

3. **Jackwerth, J. (1996), "Recovering Probability Distributions from Option Prices."**
Why it matters: one of the classic practical papers on pulling distributions from options rather than treating Black-Scholes as the answer.

4. **Ait-Sahalia, Y. (1998), "Nonparametric Estimation of State-Price Densities Implicit in Financial Asset Prices."**
Why it matters: brings statistical discipline to state-price extraction. Useful for no-arbitrage smoothing, sparse strikes, and avoiding noisy numerical differentiation.

5. **Bates, D. (1991), "The Crash of '87: Was It Expected? The Evidence from Options Markets."**
Why it matters: canonical example of using options to infer market-implied probabilities of tail events before they happen.

6. **Bliss, R. and Panigirtzoglou, N. (2002), "Testing the Stability of Implied Probability Density Functions."**
Why it matters: more operational than the pure theory papers. Useful for thinking about how stable, fragile, or estimator-dependent extracted densities are in practice.

7. **Hordahl, P. (2005), "Interpreting Implied Risk-Neutral Densities: The Role of Risk Premia."**
Why it matters: one of the most directly relevant cautionary papers for prediction markets. The extracted density is risk-neutral, not physical; any deployable external anchor needs an explicit view on that gap.

### Prediction-market interpretation papers

8. **Wolfers, J. and Zitzewitz, E. (2006), "Interpreting Prediction Market Prices as Probabilities."**
Why it matters: the cleanest reference for when prediction-market prices can be read as probabilities, when they cannot, and how risk aversion / bias / microstructure can distort that interpretation.

9. **Leigh, A., Wolfers, J., and Zitzewitz, E. (2003), "What Do Financial Markets Think of War in Iraq?"**
Why it matters: a concrete example of event probabilities being inferred from market prices and used in real time. Helpful as a template for event-linked anchor construction.

### Rates, macro, and threshold-event papers

10. **Kuttner, K. (2001), "Monetary Policy Surprises and Interest Rates: Evidence from the Fed Funds Futures Market."**
Why it matters: the foundational reference for mapping fed funds futures into meeting-specific policy probabilities and surprises.

11. **Estrella, A. and Mishkin, F. (1991), "The Term Structure as a Predictor of Real Economic Activity."**
Why it matters: classic evidence that market prices can predict discrete macro states like recession. Important for event contracts tied to recession odds or downside growth thresholds.

12. **Giannone, D., Reichlin, L., and Small, D. (2008), "Nowcasting: The Real-Time Informational Content of Macroeconomic Data."**
Why it matters: the flagship nowcasting paper. Essential if we want to anchor CPI, payrolls, GDP, or inflation-threshold contracts using mixed-frequency data before release time.

13. **Banbura, M., Giannone, D., and Modugno, M. (2013), "Now-Casting and the Real-Time Data Flow."**
Why it matters: deals directly with ragged-edge data and asynchronous release calendars, which is exactly the setting for tradable event contracts before economic releases.

14. **Adrian, T., Boyarchenko, N., and Giannone, D. (2019), "Vulnerable Growth."**
Why it matters: a useful bridge from continuous macro-financial signals to tail and threshold-event probabilities. Strong inspiration for "probability growth is below x" type contracts.

## Model Families

### 1. Risk-neutral threshold extraction from option surfaces

This is the cleanest family for finance-linked event contracts.

- Fit or smooth a no-arbitrage option surface.
- Convert call spreads or local strike derivatives into digital probabilities.
- Integrate the implied density above or below the contract threshold.
- Use monotonicity across strikes and maturities as hard constraints.

Best fit:

- BTC above `X` by date `T`
- S&P 500 above `X`
- single-name earnings or index threshold contracts

### 2. Risk-neutral to physical calibration layers

This is probably the most important modeling extension.

- Treat option-implied probabilities as a feature, not the final target.
- Learn a calibration map from risk-neutral probabilities to realized frequencies.
- Allow the mapping to depend on horizon, realized volatility, skew, carry, jump regime, and asset class.

Candidate methods:

- isotonic calibration
- beta calibration
- hierarchical logistic regression
- Bayesian shrinkage by contract family

### 3. Rates-implied policy and macro-event extraction

- Map fed funds / SOFR / OIS futures into discrete meeting-outcome probabilities.
- Use adjacent contracts to infer target and path surprises.
- Where needed, combine futures with options on rates for richer tails.

Best fit:

- Fed hike/cut/no-change contracts
- year-end policy range contracts
- contracts linked to implied number of cuts

### 4. Macro nowcasting and release-density models

- Use dynamic factor models, MIDAS-style mixed-frequency models, or Bayesian VAR / state-space models.
- Continuously update release expectations as partial data arrives.
- Convert forecast densities into event probabilities for thresholds and ranges.

Best fit:

- CPI above / below consensus or threshold
- payrolls above / below a level
- GDP nowcast-linked contracts

### 5. Threshold-event and downside-tail models

- Estimate quantiles or full predictive distributions for macro variables.
- Convert those into event probabilities rather than point forecasts.
- Use financial-conditions variables as the main drivers for downside states.

Best fit:

- recession-style contracts
- GDP or inflation downside-tail events
- hard-landing type markets

### 6. Forecast-combination and anchor-ensemble models

For production, the right system is likely an ensemble.

- combine current prediction-market price
- external anchor probability
- release-calendar features
- base-rate frequency
- venue-liquidity / spread features

This can be framed as:

- stacked logistic model
- Bayesian model average
- regime-switching ensemble

## Transferable Ideas

### Best ideas to port directly

1. **Model the contract as a digital option whenever possible.**
If a Kalshi or Polymarket contract is "BTC above `X` by `T`," the right mental model is a digital payoff on a terminal price event.

2. **Separate extraction from calibration.**
First recover a clean market-implied anchor. Then ask how that anchor historically maps into realized outcomes.

3. **Use monotone contract families as a free consistency check.**
Threshold ladders across `X` and `T` should be monotone. That gives a natural denoising prior and a way to detect bad quotes.

4. **Prefer objective, mechanically resolvable contracts first.**
Fed, CPI, payrolls, BTC, index levels, and simple rate thresholds are much better external-anchor candidates than politics or geopolitics.

5. **Attach uncertainty bands to the anchor.**
An external anchor should be a distribution with confidence bands, not a single fair probability. Trade only when the market deviates beyond fees, slippage, and model uncertainty.

6. **Exploit release timing.**
Macro nowcasting papers are useful because event contracts live on a release calendar. Probability should jump as partial indicators arrive, and that jump process itself can be modeled.

7. **Use the prediction-market price as an input, not just the target to beat.**
The best model may be "external anchor minus venue-specific distortion," not pure external-anchor replacement.

## Limitations

1. **Risk-neutral is not physical.**
This is the main conceptual trap. Option-implied distributions reflect pricing kernels, not just beliefs.

2. **Exact contract mapping is often messy.**
Prediction markets resolve on specific timestamps, venues, reference sources, and wording. Small mismatches can fake edge.

3. **Option surfaces are not equally good across assets.**
BTC options may be usable but noisier; single-name or niche underlyings may have poor depth at the needed strike and maturity.

4. **Macro anchors are model-fragile.**
Rates-implied policy probabilities are excellent near FOMC events; they are weaker for broader macro questions unless carefully combined with nowcasts.

5. **Prediction-market frictions may dominate.**
Fees, spread, market-order impact, discrete price grids, delayed fills, and contract caps can erase theoretical edge.

6. **Not every contract has a legitimate external anchor.**
Politics, culture, and many legal or geopolitical event markets do not have a clean, tradable outside benchmark.

7. **Structural breaks matter.**
Policy regimes, crypto microstructure, and option-market demand imbalances can all change the anchor mapping over time.

## Ranked Shortlist for External-Anchor Research

### 1. Option-implied threshold probabilities for BTC and major-index contracts

Why first:

- cleanest payoff mapping
- strongest theory
- easiest to test
- directly relevant to Polymarket crypto thresholds and any Kalshi index-style thresholds

Research shape:

- start with digital approximations from listed option surfaces
- impose strike/horizon monotonicity
- learn a light calibration layer from risk-neutral to realized

### 2. Fed decision contracts anchored to fed funds / SOFR / OIS futures

Why second:

- Kuttner-style mapping is well established
- contract wording is usually objective
- market-moving events create repeated observations

Research shape:

- map each contract to a meeting-specific outcome tree
- estimate no-change / 25 bp / 50 bp probabilities
- compare prediction-market quotes to futures-implied distributions

### 3. CPI, payrolls, and GDP-threshold contracts using nowcasts plus rates repricing

Why third:

- repeatable calendar
- strong data flow
- high practical relevance for Kalshi-style macro markets

Research shape:

- build a real-time nowcast distribution
- combine with market repricing signals close to release
- convert density into contract-specific threshold probabilities

### 4. Growth-at-risk / recession-threshold contracts from financial conditions

Why fourth:

- useful for recession or hard-landing event markets
- intellectually strong, but less direct than Fed or BTC thresholds

Research shape:

- use yield-curve, credit-spread, equity-vol, and financial-conditions inputs
- estimate downside quantiles or recession probabilities
- trade only when prediction-market prices move far from model bands

### 5. Ensemble models that learn venue-specific distortion around the external anchor

Why fifth:

- probably best for production alpha
- requires the earlier anchors first

Research shape:

- model `prediction price - anchor probability`
- explain the residual with attention, liquidity, time-to-resolution, and venue-specific mechanics

### 6. Full nonparametric state-price-density extraction for ladder and range markets

Why sixth:

- high upside eventually
- more engineering and estimation complexity than the first four lines of attack

Research shape:

- recover the whole density
- price every threshold or bucket from one common surface
- use it mainly after simpler digital-anchor models are already working

## Working Conclusion

The most transferable literature for a Kalshi/Polymarket external-anchor program is not generic forecasting research. It is the intersection of:

- option-implied state-price extraction
- rates-implied policy probability extraction
- macro nowcasting
- threshold-event distribution modeling

The best first prototype is likely narrow:

- finance-linked binary contracts only
- objective resolution only
- external anchor as a calibrated probability band
- trade only when deviation exceeds execution and model-error buffers

That points to a Phase I stack centered on:

1. BTC or index threshold contracts
2. Fed meeting contracts
3. CPI or payrolls threshold contracts

Everything else should be treated as a later expansion rather than the starting point.
