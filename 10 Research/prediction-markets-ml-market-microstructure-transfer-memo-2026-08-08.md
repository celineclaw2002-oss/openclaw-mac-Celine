---
title: ML Market Microstructure Transfer Memo for Prediction Markets
created: 2026-08-08
updated: 2026-08-08
status: active
domain: trading
type: research
visibility: internal
---

# ML Market Microstructure Transfer Memo for Prediction Markets

## Purpose

This memo identifies the researchers, papers, and model families from market microstructure, limit order books, structured prediction, and market-making that are most likely to transfer to an internal-consistency prediction-market strategy on venues such as Kalshi and Polymarket.

The filter is practical applicability, not academic completeness.

## Leaders

### 1. Rama Cont

- Core area: empirical microstructure, order flow, price impact, stylized facts.
- Why he matters: Cont's work is among the cleanest bridges from raw book events to tractable predictive state variables.
- Transfer to prediction markets:
  - model event-level price impact from adds, cancels, and marketable flow
  - build queue and imbalance features for thin binary books
  - treat probability moves as order-flow responses, not just "news"

### 2. Sasha Stoikov

- Core area: market making, LOB price impact, quoting under inventory risk.
- Why he matters: combines microstructure measurement with dealer-style control problems.
- Transfer:
  - useful when internal-consistency strategies still need to warehouse inventory
  - natural framework for deciding when to quote versus cross
  - good for sizing against fill-risk and adverse-selection risk

### 3. Alvaro Cartea and Sebastian Jaimungal

- Core area: algorithmic trading, order book signals, execution, market making.
- Why they matter: among the most practical researchers for converting LOB features into deployable trading logic.
- Transfer:
  - order-book signals as gating variables for whether a consistency edge is actually tradable
  - execution-aware alpha rather than naive mispricing detection
  - strong fit for venue-specific fill and inventory models

### 4. Charles-Albert Lehalle and Mathieu Rosenbaum

- Core area: queue-reactive models, LOB simulation, execution and market ecology.
- Why they matter: their work is useful when depth is thin and queue position matters more than headline spread.
- Transfer:
  - simulate fill odds in sparse binary books
  - estimate how fast displayed edge decays after queue changes
  - model venue mechanics before running live quoting logic

### 5. Marco Avellaneda

- Core area: canonical market-making control under inventory risk.
- Why he matters: the Avellaneda-Stoikov setup is still the default conceptual baseline for quoting.
- Transfer:
  - strongest use is not alpha discovery but execution policy once a consistency signal exists
  - especially relevant for two-sided quoting in related contracts

### 6. Zihao Zhang, Stefan Zohren, Stephen Roberts

- Core area: deep learning on LOB tensors.
- Why they matter: DeepLOB became the reference template for learned representations from book states.
- Transfer:
  - helpful if prediction-market books are deep enough to justify learned state encoders
  - more likely useful on Polymarket than Kalshi if event activity is high enough
  - best as a feature extractor feeding a constraint-aware layer, not as a standalone directional predictor

### 7. Justin Sirignano

- Core area: universal high-frequency price formation via deep learning.
- Why he matters: argues that common predictive structure exists across assets at the event level.
- Transfer:
  - suggests pooling across many prediction markets instead of training market-by-market only
  - useful for transfer learning on sparse contracts

### 8. Petter Kolm, Jeremy Turiel, Nicholas Westray

- Core area: modern deep order-flow models and horizon-specific alpha extraction.
- Why they matter: emphasize that operational tradability matters more than standard ML accuracy metrics.
- Transfer:
  - ideal framing for prediction markets, where many apparent inconsistencies are not monetizable after fees and fill uncertainty
  - strong fit for "edge survives execution?" ranking

### 9. Andrew McCallum / John Lafferty / Michael Jordan lineage

- Core area: structured prediction and conditional random fields.
- Why they matter: internal consistency is fundamentally a structured prediction problem, not just a univariate forecasting problem.
- Transfer:
  - enforce coherence across mutually exclusive and collectively exhaustive contracts
  - map partitions, ladders, and temporal nesting into factor graphs

### 10. Thomas Kipf, Max Welling, Petar Velickovic

- Core area: graph neural networks.
- Why they matter: graph models are a natural way to represent cross-contract relationships.
- Transfer:
  - contracts become nodes, constraints become edges or hyperedges
  - useful for learning when mispricings propagate across related markets
  - especially promising for Polymarket's denser event trees and combo structures

## Important papers

### Microstructure and LOB

1. Rama Cont. "Empirical properties of asset returns: stylized facts and statistical issues" (2001).
- Contribution: canonical summary of heavy tails, volatility clustering, and non-Gaussian market behavior.
- Transfer: a reminder not to build prediction-market simulators around smooth Gaussian assumptions, especially near event resolution.

2. Rama Cont, Arseniy Kukanov, Sasha Stoikov. "The Price Impact of Order Book Events" (2013).
- Contribution: decomposes price moves into the effects of limit orders, cancellations, and market orders.
- Transfer: one of the best templates for measuring how probability changes respond to micro-events in Kalshi/Polymarket books.

3. Weibing Huang, Charles-Albert Lehalle, Mathieu Rosenbaum. "Simulating and Analyzing Order Book Data: The Queue-Reactive Model" (2014).
- Contribution: models order flow conditional on current queue state.
- Transfer: highly relevant for estimating fill probability and queue-jump risk in thin binary books.

4. Alec Kercheval, Yuan Zhang. "Modelling high-frequency limit order book dynamics with support vector machines" (2015).
- Contribution: early but influential supervised-learning baseline on LOB state prediction.
- Transfer: useful as a robust low-complexity baseline before jumping to deep models.

5. Justin Sirignano, Rama Cont. "Universal features of price formation in financial markets: perspectives from deep learning" (2019).
- Contribution: shows shared event-level predictive structure across assets.
- Transfer: supports cross-market pooled training for sparse prediction-market contracts.

6. Zihao Zhang, Stefan Zohren, Stephen Roberts. "DeepLOB: Deep Convolutional Neural Networks for Limit Order Books" (2019).
- Contribution: canonical deep architecture for extracting predictive signals from multi-level LOB states.
- Transfer: best used as a learned microstructure encoder when enough event data exists.

7. Petter N. Kolm, Jeremy Turiel, Nicholas Westray. "Deep order flow imbalance: Extracting alpha at multiple horizons from the limit order book" (2023).
- Contribution: emphasizes multi-horizon signal extraction and operational evaluation.
- Transfer: very strong fit for ranking which consistency gaps are actually executable.

8. Alvaro Cartea, Ryan Donnelly, Sebastian Jaimungal. "Enhancing trading strategies with order book signals" (2018).
- Contribution: translates book-derived variables into better trading decisions.
- Transfer: ideal for deciding whether a consistency edge should be crossed immediately, joined passively, or ignored.

### Market making and execution

9. Marco Avellaneda, Sasha Stoikov. "High-frequency trading in a limit order book" (2008).
- Contribution: the classic inventory-risk-aware market-making framework.
- Transfer: baseline quoting logic for internal-consistency portfolios where you hold exposure across linked contracts.

10. Olivier Gueant, Charles-Albert Lehalle, Joaquin Fernandez-Tapia. "Dealing with the Inventory Risk: a solution to the market making problem" (2013).
- Contribution: practical refinements of the Avellaneda-Stoikov setup and closed-form quoting approximations.
- Transfer: useful if you want an interpretable quoting layer instead of pure RL.

11. Robert Almgren, Neil Chriss. "Optimal Execution of Portfolio Transactions" (2000).
- Contribution: foundational execution-cost and liquidation tradeoff framework.
- Transfer: relevant when inconsistency trades span baskets of related contracts and legging risk matters.

### Structured prediction and graph methods

12. John Lafferty, Andrew McCallum, Fernando Pereira. "Conditional Random Fields: Probabilistic Models for Segmenting and Labeling Sequence Data" (2001).
- Contribution: standard framework for structured outputs under local/global constraints.
- Transfer: very strong conceptual fit for enforcing coherent prices across related prediction contracts.

13. Daphne Koller, Nir Friedman. "Probabilistic Graphical Models" (book, 2009).
- Contribution: general toolkit for factorized dependence and inference.
- Transfer: useful for turning market families into factor graphs with no-arbitrage or near-arbitrage constraints.

14. Thomas Kipf, Max Welling. "Semi-Supervised Classification with Graph Convolutional Networks" (2016).
- Contribution: simple, influential message-passing model on graphs.
- Transfer: good first graph baseline for contract networks.

15. Petar Velickovic et al. "Graph Attention Networks" (2017).
- Contribution: attention-weighted message passing over graph neighborhoods.
- Transfer: useful when some links between contracts matter much more than others, such as parent-child event relations or overlapping outcome sets.

## Transferable ideas

### Best transfers

1. Constraint graph over contracts
- Represent each contract as a node.
- Add factors for partitions, complements, temporal nesting, and shared latent drivers.
- Use CRF, factor-graph, or GNN machinery to estimate a coherent latent probability surface.
- Trading signal becomes deviation from that coherent surface, not raw direction.

2. Queue-aware executability filter
- For each detected inconsistency, estimate:
  - fill probability
  - time-to-fill
  - probability edge vanishes before fill
  - expected slippage if crossed
- This is straight from queue-reactive and order-flow work.

3. Multi-horizon alpha labeling
- Label opportunities by short-horizon snapback, medium-horizon convergence, and end-of-life convergence.
- Many prediction-market inconsistencies are not immediate; they close only after clarification, volume arrival, or resolution approach.

4. Cross-market pooled representation learning
- Pool books across many markets and event families.
- Learn shared representations for thin-market states, then fine-tune by category.
- Sirignano/Cont is the best intellectual support for this move.

5. Inventory-aware basket execution
- Internal consistency trades are often multi-leg.
- Use Avellaneda-Stoikov or Almgren-Chriss style logic to choose quoting aggressiveness conditional on current residual inventory and legging risk.

6. Event-level state variables over candle-style features
- Track adds, cancels, trades, queue depletion, spread regime, and depth asymmetry.
- LOB literature strongly suggests these dominate coarse OHLC-style summaries for short-horizon execution problems.

### Most promising model families

1. Factor-graph or CRF-style coherence model plus microstructure residual model.
- Best overall fit.
- Clean separation between "fair coherent probability" and "tradeability."

2. GNN over contract relationship graph plus queue/execution head.
- Best if market relationships are complex and dynamic.
- Especially attractive for Polymarket.

3. Simpler linear/logit or tree model on handcrafted imbalance and consistency features.
- Best first production baseline.
- Likely easier to trust and debug than deep end-to-end systems.

4. DeepLOB-style encoder only as a subordinate component.
- Good if enough high-frequency data exists.
- Not the first model I would build for Kalshi-style markets.

## Weak fits

1. Pure directional mid-price prediction.
- Weak because the main edge in prediction markets is often structural inconsistency, not standalone short-term direction.

2. End-to-end deep RL for market making.
- Weak for v1 because data is sparse, stationarity is poor, and policy learning can hide basic modeling mistakes.

3. Ultra-HFT equities-style assumptions.
- Weak because Kalshi and Polymarket are thinner, more episodic, and more event-driven than equities futures or liquid stocks.

4. Transformer-heavy sequence models without explicit constraints.
- Weak because they may fit local microstructure while missing the actual tradable object: cross-contract coherence.

5. Hawkes-only approaches as the main model.
- Useful for event clustering, but usually too narrow as the central prediction-market framework unless paired with constraint logic.

## Ranked shortlist for internal consistency

### 1. Cont + structured prediction

- Core stack:
  - Cont/Kukanov/Stoikov price-impact measurement
  - CRF or factor-graph coherence layer
  - simple execution model
- Why ranked first:
  - most direct route from "markets should add up" to executable residual signals
  - interpretable and debuggable
  - good fit for sparse data

### 2. Cartea/Jaimungal + queue-reactive execution

- Core stack:
  - consistency residual features
  - order-book signals
  - queue-reactive fill model
- Why ranked second:
  - strongest practical bridge from signal to actual order placement
  - especially good for deciding passive versus aggressive execution

### 3. GNN over contract graph + execution head

- Core stack:
  - contract relationship graph
  - GCN/GAT style message passing
  - separate queue/fill model
- Why ranked third:
  - best medium-term architecture if Polymarket-style event graphs matter
  - more flexible than CRFs, but harder to debug and easier to overfit

### 4. Sirignano/DeepLOB pooled microstructure encoder under a coherence layer

- Core stack:
  - pooled event-level encoder
  - coherence projection
  - execution filter
- Why ranked fourth:
  - attractive if enough data accumulates across many contracts
  - probably premature before a strong handcrafted baseline exists

### 5. Avellaneda-Stoikov style quoting overlay

- Core stack:
  - any of the above alpha engines
  - inventory-aware quoting policy
- Why ranked fifth:
  - crucial for monetization, but not the source of edge
  - belongs as an overlay, not the core research thesis

## Bottom line

If the goal is an internal-consistency strategy for Kalshi or Polymarket, the best starting point is not "deep learning on books" and not "general market making."

It is:

1. a structured coherence model across related contracts,
2. a Cont/Cartea-style event-flow and imbalance feature set,
3. a queue-aware executability model,
4. an inventory-aware execution overlay.

That stack is the highest-probability path to something both intellectually sound and realistically tradable.
