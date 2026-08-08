# Prediction Markets Research Track 3 - ML Researchers To Borrow From

## Framing

This track asks a narrower question than "who is important in ML?" The useful question is: whose methods transfer cleanly into prediction markets, especially for:

- cross-contract internal consistency
- exogenous fair-value anchoring
- probabilistic calibration
- low-liquidity execution

My view: the biggest wins are not from generic "state-of-the-art ML" but from a small set of researchers whose work helps with:

1. structured latent-state learning across related contracts
2. calibrated multi-horizon forecasting with exogenous covariates
3. graph-based coherence over event families and partitions
4. RL-style execution in thin, impact-sensitive markets

## The short list

### 1. Tilmann Gneiting

- Area: probabilistic forecasting, calibration, scoring
- Flagship papers:
  - `Probabilistic Forecasts, Calibration and Sharpness` (with Balabdaoui and Raftery, 2007)
  - `Strictly Proper Scoring Rules, Prediction and Estimation` (with Raftery, 2007)
- What he advanced:
  - made calibration and sharpness central rather than optional
  - gave the evaluation language for probabilistic models that output distributions, not point estimates
  - pushed proper scoring rules that directly map to whether a predictive distribution is decision-useful
- Why he matters for prediction markets:
  - event-contract modeling lives or dies on calibrated probabilities
  - the right question is not "did the model rank things well?" but "are 62 percent contracts actually 62 percent contracts after fees and resolution noise?"
  - this is especially important if market prices themselves are noisy labels
- Best fit:
  - `External-anchor` first
  - also a universal evaluation backbone for `internal consistency`
- Opinion:
  - If you skip Gneiting, you risk building a flashy model with no reliable notion of whether its probabilities deserve capital.

### 2. Bryan Lim

- Area: interpretable sequence models for forecasting
- Flagship paper:
  - `Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting` (with Arik, Loeff, and Pfister, 2021)
- What he advanced:
  - one of the clearest architectures for mixed-input forecasting with static features, known future inputs, and historical covariates
  - made interpretable multi-horizon deep forecasting much more practical
- Why he matters for prediction markets:
  - prediction markets often have known future structure: debate dates, CPI releases, FOMC meetings, election deadlines, contract expiries
  - TFT-style designs are a strong template for objective event families where timing and exogenous covariates matter
  - the variable selection and gating logic is attractive when data are sparse and heterogeneous
- Best fit:
  - `External-anchor`
  - secondarily `hybrid`
- Opinion:
  - For finance-linked prediction markets, this is more directly useful than most generic transformer work.

### 3. David Salinas and Jan Gasthaus

- Area: global probabilistic forecasting
- Flagship paper:
  - `DeepAR: Probabilistic Forecasting with Autoregressive Recurrent Networks` (with Flunkert, 2017)
- What they advanced:
  - global models trained across many related series rather than one model per series
  - practical probabilistic forecasting with recurrent nets and likelihood-based training
- Why they matter for prediction markets:
  - event contracts should usually not be modeled one-by-one
  - related markets share structure: repeated macro releases, threshold ladders, winner-take-all partitions, venue-specific flow regimes
  - the "many related series" intuition transfers directly to families of contracts and synthetic submarkets
- Best fit:
  - `Hybrid`, leaning `external-anchor`
- Opinion:
  - This is one of the cleanest conceptual bridges from commercial forecasting to a cross-contract prediction-market stack.

### 4. Thomas Kipf and Max Welling

- Area: graph neural networks
- Flagship paper:
  - `Semi-Supervised Classification with Graph Convolutional Networks` (2017)
- What they advanced:
  - made graph convolution a practical baseline for relational learning
  - showed how node features and graph structure can be learned jointly at scale
- Why they matter for prediction markets:
  - many prediction-market universes are graphs by construction:
    - threshold ladders
    - mutually exclusive partitions
    - same question across venues
    - parent-child temporal nesting
    - event/entity relationships
  - GCN-style methods are natural for enforcing or learning coherence over that structure
- Best fit:
  - `Internal consistency`
- Opinion:
  - If I were building a first serious internal-consistency model, Kipf/Welling would be nearer the center than any transformer paper.

### 5. Petar Velickovic

- Area: graph attention networks
- Flagship paper:
  - `Graph Attention Networks` (with Cucurull, Casanova, Romero, Lio, and Bengio, 2018)
- What he advanced:
  - brought attention-style adaptive weighting into graph neighborhoods
  - made it easier to learn which edges matter more, instead of treating all local structure as equally informative
- Why he matters for prediction markets:
  - not all cross-contract links deserve equal trust
  - some edges are mechanical constraints; others are weak semantic analogies; others are venue mappings with basis risk
  - GAT-style weighting is a good fit when your market graph is noisy and partially wrong
- Best fit:
  - `Internal consistency`
- Opinion:
  - More useful than plain GCNs when the contract graph is messy, which is exactly the likely state of real prediction-market data.

### 6. Sepp Hochreiter and Jurgen Schmidhuber

- Area: sequence modeling
- Flagship paper:
  - `Long Short-Term Memory` (1997)
- What they advanced:
  - solved the practical long-range dependency problem for recurrent modeling
  - created the workhorse template for sequential forecasting before transformers
- Why they matter for prediction markets:
  - recurrent sequence models still matter in small-data, irregular-data, low-latency settings
  - for order-book state, fill dynamics, and release-driven drift, LSTM-style models remain useful baselines
  - they are often better behaved than large transformers when the dataset is not internet-scale
- Best fit:
  - `Hybrid`
- Opinion:
  - Not glamorous, still worth respecting. In thin markets, humble recurrent models can beat oversized attention stacks.

### 7. Ashish Vaswani

- Area: transformers, attention
- Flagship paper:
  - `Attention Is All You Need` (with Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, and Polosukhin, 2017)
- What he advanced:
  - made attention-based sequence modeling the dominant paradigm
  - enabled better long-range dependency modeling and multimodal fusion
- Why he matters for prediction markets:
  - useful if you want to combine price history with text, calendars, macro releases, polling, or news embeddings
  - particularly attractive for event contracts whose fair value depends on heterogeneous external information
- Best fit:
  - `External-anchor`
- Opinion:
  - Important, but easy to overrate. For prediction markets, the transformer is often a component, not the whole edge.

### 8. Yoshua Bengio

- Area: representation learning
- Flagship papers:
  - `A Neural Probabilistic Language Model` (with Ducharme, Vincent, and Jauvin, 2003)
  - `Representation Learning: A Review and New Perspectives` (with Courville and Vincent, 2013)
- What he advanced:
  - the modern representation-learning worldview
  - distributed embeddings and latent-state learning as a general recipe for extracting structure from complex data
- Why he matters for prediction markets:
  - the useful transfer is not language modeling per se but the idea that markets and contracts can be embedded in shared latent spaces
  - that supports regime discovery, contract similarity, venue mapping, and transfer learning across sparse event categories
- Best fit:
  - `Internal consistency`, with `hybrid` upside
- Opinion:
  - Foundational but indirect. Borrow the mindset more than the specific papers.

### 9. Yuriy Nevmyvaka and Michael Kearns

- Area: reinforcement learning for execution
- Flagship paper:
  - `Reinforcement Learning for Optimized Trade Execution` (with Feng, 2006)
- What they advanced:
  - early serious application of RL to execution under market impact and microstructure constraints
  - framed execution as a sequential control problem rather than static slicing
- Why they matter for prediction markets:
  - execution is likely much harder than forecasting in thin prediction markets
  - queue position, spread capture, adverse selection, and partial fills matter a lot when edge is small
  - their framing is highly transferable once a fair-value model exists
- Best fit:
  - `Internal consistency`
- Opinion:
  - This is the right RL lineage to study first, not general game-playing RL.

## Who I would prioritize first

### Best for internal consistency

1. `Thomas Kipf / Max Welling`
2. `Petar Velickovic`
3. `Yoshua Bengio`
4. `Yuriy Nevmyvaka / Michael Kearns`
5. `Sepp Hochreiter / Jurgen Schmidhuber`

Why:

- prediction markets naturally generate graphs, partitions, ladders, and temporal nesting
- market-only structure is often easier to trust than external data pipelines
- execution quality matters because liquidity is thin and alpha can be small

### Best for external-anchor modeling

1. `Tilmann Gneiting`
2. `Bryan Lim`
3. `David Salinas / Jan Gasthaus`
4. `Ashish Vaswani`
5. `Sepp Hochreiter / Jurgen Schmidhuber`

Why:

- objective event contracts need calibrated distributions, not just directional calls
- exogenous covariates and known calendars are unusually important in event markets
- multi-horizon forecasting templates map well to release-driven repricing

## My strongest take

If the goal is prediction-market alpha rather than ML tourism:

- start with `Gneiting` for calibration discipline
- use `Kipf/Welling` and `Velickovic` for internal-consistency structure
- use `Bryan Lim` and `DeepAR` style global forecasting for external-anchor sleeves
- study `Nevmyvaka/Kearns` only after fair-value estimation exists and you are ready to optimize execution

The common mistake would be to jump straight to generic large transformers. In prediction markets, structure, calibration, and execution probably matter more than raw model scale.
