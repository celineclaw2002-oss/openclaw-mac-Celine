---
title: Prediction Markets Primer - Kalshi and Polymarket
created: 2026-08-08
updated: 2026-08-08
status: active
domain: trading
type: research
visibility: internal
---

# Prediction Markets Primer: Kalshi and Polymarket

## Purpose

This note is a reusable working brief on how Kalshi and Polymarket operate, written from the perspective of a quant researcher evaluating prediction-market microstructure, execution, data access, and structural edge.

It is meant to answer two questions:

1. How do these venues actually work in practice?
2. What matters if we want to build a serious quasi-arbitrage / statistical-mispricing bot on top of them?

## Scope and caveats

- Focus is on prediction markets, not Polymarket perps.
- Sources are primarily official docs and official help-center pages as of `2026-08-08`.
- Some details, especially fees, market-specific delays, and rate limits, can change by venue, category, or market configuration.
- This note is a research brief, not legal advice or compliance clearance.

## Executive summary

Kalshi and Polymarket both let users trade binary event outcomes, but they are very different systems.

- **Kalshi** is a CFTC-regulated exchange with exchange-style market structure, conventional account/KYC onboarding, fiat-friendly rails, and a cleaner operational surface for a professional trading stack.
- **Polymarket** is a hybrid crypto venue: offchain order creation and matching, onchain settlement, ERC1155 outcome tokens, Polygon infrastructure, wallet-signing, geoblocking, and oracle-driven resolution via UMA.

From a quant-research standpoint:

- **Kalshi** is operationally simpler and legally cleaner, but likely more institutionally legible and therefore harder to surprise.
- **Polymarket** is structurally richer and more idiosyncratic, with more room for token- and microstructure-driven mispricings, but materially higher operational complexity.

The likely best medium-term edge is not "fast news scraping" in the abstract. It is venue-specific structure:

- internal consistency violations
- cross-venue relative value
- resolution-horizon distortions
- event-design and retail-flow distortions
- financially linked contracts where outside markets anchor fair value better than venue participants do

## Kalshi

### What Kalshi is

Kalshi is a regulated event-contract exchange. Contracts are financial derivatives on real-world events. The platform exposes prediction-market trading through web UI and API, with prediction-market REST, WebSocket, and FIX surfaces.

### Core market structure

Kalshi markets are binary contracts.

- A `YES` contract pays `$1` if the event resolves yes.
- A `NO` contract pays `$1` if the event resolves no.
- Settlement is netted: only net positions are ultimately settled.

Kalshi exposes direction in two equivalent vocabularies:

- `outcome_side`: `yes` or `no`
- `book_side`: `bid` or `ask`

Kalshi explicitly maps:

- `bid ≡ yes`
- `ask ≡ no`

Important nuance: on order/fill/trade objects, price does not change when you flip direction. A `NO` order at price `p` matches a `YES` order at the same `p`; the difference is exposure, not trade price.

### Order book representation

Kalshi's book representation is unusual if you come from equities/options.

- Public order book responses return **YES bids** and **NO bids** only.
- There are no asks in the canonical REST order book response.
- This is because in a binary market, a `YES` bid at `X` is equivalent to a `NO` ask at `1 - X`.

This matters for any execution engine or simulator. You cannot naively import equity-market best-bid/best-ask assumptions; you need explicit binary-outcome translation logic.

### Market lifecycle

Kalshi documents a fairly explicit market-state machine:

- `initialized`
- `active`
- `inactive`
- `closed`
- `determined`
- `disputed`
- `amended`
- `finalized`

Important operational details:

- `inactive` means paused, not dead.
- After `close_time`, order operations including cancellation are rejected with `MARKET_INACTIVE`.
- Resting orders are cancelled shortly after market close.
- Once a result is set, the market becomes `determined`, then runs a settlement timer before finalization.
- Determinations can be disputed and amended.

For a bot, this means venue-state handling cannot be simplistic. There is a real distinction between tradable, paused, closed-awaiting-resolution, and economically finished.

### Settlement

For plain yes/no markets:

- winning side pays `$1` per contract
- losing side pays `$0`
- no settlement fee on simple yes/no determination

Kalshi notes that scalar or sub-cent settlement can have different payout/rounding behavior.

### Fees

Kalshi fees are tied to expected earnings and are not just flat commissions.

The published general formula is:

`fee = round_up(0.07 × C × P × (1 - P))`

Where:

- `C` = contracts traded
- `P` = contract price in dollars

Important nuances:

- Fee burden is highest near `P = 0.50`.
- Some markets have special fee schedules or different multipliers.
- Some markets also have **maker fees**.
- Maker fees only apply if a resting order is eventually executed.
- There is no fee for canceling a resting order.

Kalshi also documents a **rounding-fee** system:

- direct-member balances target `0.0001` dollar precision
- non-direct-member balances target `0.01` dollar precision
- each fill may include trade fee, rounding fee, and rebate
- fee accumulation occurs per order across fills

For research/backtesting this is not cosmetic. On very small or fragmented fills, realized economics can diverge from simple closed-form fee estimates unless you model venue rounding properly.

### API and connectivity

Kalshi exposes:

- REST
- WebSocket
- FIX

Important mechanics:

- public market data is available without authentication
- authenticated requests use API keys plus RSA-PSS request signing
- signing uses `timestamp + HTTP method + path_without_query`
- production market-data root is `https://external-api.kalshi.com/trade-api/v2`
- demo environment exists and is separate from production

Demo environment:

- `https://demo.kalshi.co/`
- separate credentials from prod
- useful for API plumbing but not trustworthy for price realism

### Rate limits

Kalshi uses token-bucket rate limits with separate **Read** and **Write** budgets.

Important details:

- most requests cost `10` tokens
- rate limit tiers include `Basic`, `Advanced`, `Expert`, `Premier`, `Paragon`, `Prime`, `Prestige`
- authenticated users can burst up to bucket capacity
- some tiers hold up to two seconds of budget
- 429s do not include standard exchange-style rate headers; bucket simply refills continuously
- batch endpoints do **not** save tokens; they charge item-by-item

For a real-time strategy, this matters. It shapes the architecture of order amendment loops, polling fallbacks, and how aggressively you can refresh state during event shocks.

### Account structure, onboarding, and jurisdiction

Kalshi is heavily identity-verified.

- account opening requires personal information
- KYC / document verification is part of the process
- Kalshi states it is accessible internationally, but some jurisdictions remain restricted
- users are responsible for ensuring lawful access in their own jurisdiction

Institutional accounts also exist, and entity onboarding is supported.

### Quant take on Kalshi

What stands out:

- cleaner regulated venue surface
- easier to integrate into a professional risk and operations stack
- better fit for systematic research tied to finance and macro
- lower crypto-friction than Polymarket

What to watch:

- fee modeling near mid-probabilities matters
- binary book semantics are easy to mis-handle
- market close / determination / settlement windows are operationally important
- likely lower tolerance for sloppy automation or gray-area jurisdictional behavior

## Polymarket

### What Polymarket is

Polymarket is a crypto-native prediction market built around tokenized yes/no outcomes on Polygon.

The current prediction-market stack is hybrid:

- orders are created and signed offchain
- a centralized operator runs the CLOB and matching layer
- matched trades are settled onchain through exchange contracts
- positions are represented as ERC1155 conditional tokens

This gives Polymarket a very different failure surface from Kalshi.

### Contract stack

Polymarket prediction markets sit on a multi-contract stack, including:

- standard CTF exchange
- neg-risk CTF exchange
- Conditional Tokens contract
- pUSD token
- collateral onramp and offramp contracts
- deposit-wallet factory
- UMA adapter

The practical lesson is that Polymarket is not just "a website with prices." It is an exchange contract layer, a token layer, a collateral layer, a wallet/account layer, and an oracle layer. Each of those layers can create its own operational risk or mispricing opportunity.

### Market and token model

Each prediction market has exactly two outcome tokens:

- `YES`
- `NO`

Each winning token redeems for `$1`, losing token for `$0`.

Important token facts:

- outcome shares are ERC1155 assets on Polygon
- they use the Gnosis Conditional Token Framework
- every complete Yes/No pair is backed by exactly `$1` of collateral
- collateral is now **pUSD**, not legacy USDC.e

Core token operations:

- **Split**: convert pUSD into paired yes/no inventory
- **Trade**: buy or sell one leg on the book
- **Merge**: recombine equal yes/no inventory back into pUSD
- **Redeem**: after resolution, winning token -> pUSD

This is critical for market-making or inventory strategies. On Polymarket, split/merge economics are part of the strategy design, not just back-office details.

One subtle but very important detail from the exchange design: fills do not only happen as plain buy-versus-sell transfers.

Documented settlement paths include:

- **complementary**: straightforward opposite-side transfer
- **mint**: same-side buy flow can clear by splitting collateral into paired outcomes
- **merge**: same-side sell flow can clear by merging complementary outcome inventory back into collateral

That means observed book dynamics are not the whole economic story. Some valid fills can happen through collateral transformation, not only through obvious opposite-side resting liquidity.

### Event and market model

Polymarket separates:

- **Event**: broader object grouping one or more related markets
- **Market**: individual yes/no question

Each market has:

- a `conditionId`
- a `YES` token ID
- a `NO` token ID

This means normalization is nontrivial. A single event can contain multiple economically related markets, and any research engine needs a clean ontology for event, market, token, and resolution rules.

### Order lifecycle and matching

Polymarket states explicitly:

- all orders are limit orders
- "market orders" are just aggressively priced limit orders
- orders are EIP-712 signed
- the operator validates signatures, balances, allowances, and tick-size compliance
- if marketable, orders either match or go through configured delay logic
- matched trades settle atomically onchain

Supported order types:

- `GTC`
- `GTD`
- `FOK`
- `FAK`
- post-only behavior is also supported

Important execution nuance:

- **price improvement benefits the taker**
- on selected markets, there is a **taker delay**
- docs mention `250 ms` delay on selected crypto and finance up/down markets
- sports markets may have their own delay windows around live-game conditions
- during delay windows, orders are pending and cannot be cancelled

This is a major strategy-design implication. Some seemingly attractive reactive strategies may fail because the venue intentionally inserts friction on fast-moving marketable flow.

There are also venue-mode details that matter for automation:

- matching-engine restart periods can return `425`
- after restart, the venue can temporarily run in post-only mode
- GTD expiry is constrained and not arbitrarily free-form

These are the sort of operational quirks that break brittle bots even when the signal is good.

### Order book and real-time data

Polymarket exposes a more standard-looking book than Kalshi:

- explicit bids and asks per token
- order book returned for a specific token ID
- response includes `tick_size`, `min_order_size`, `neg_risk`, `last_trade_price`, and a state `hash`

Useful real-time signals include:

- book updates
- price changes
- last trade price
- tick size changes
- optional best bid / ask
- new market events
- market resolved events

This is a richer real-time surface than many people realize and is a strong foundation for:

- event-driven feature generation
- microstructure classification
- order-book imbalance analytics
- live opportunity scanning

For production gating, market-status and market-detail fields that matter include:

- `active`
- `closed`
- `acceptingOrders`
- `restricted`
- `negRisk`
- `archived`

### Fees

Polymarket fees are dynamic by category and are charged at match time.

Base formula:

`fee = C × feeRate × p × (1 - p)`

Key details:

- only **takers** pay fees
- makers are never charged fees
- geopolitical / world-event markets are fee-free
- fee is symmetric around `p = 0.50`
- fee precision is to `0.00001` USDC
- near-extreme tiny trades may round to zero

Published category examples:

- crypto: `0.07`
- sports: `0.05`
- finance: `0.04`
- politics: `0.04`
- economics: `0.05`
- tech: `0.04`
- geopolitics: `0`

This makes Polymarket economically attractive for passive liquidity provision relative to Kalshi, but it also means taker-heavy strategies must be highly selective.

### Rewards and rebates

Polymarket has a more layered incentive system than Kalshi.

Documented programs include:

- liquidity rewards
- maker rebates funded from taker fees
- taker rebates based on volume tiers
- holding rewards on eligible markets

That means raw spread capture is not the full economic picture. A strategy may only make sense after reward capture, or may look attractive gross but weak net once reward eligibility is modeled correctly.

### Resolution and dispute system

Polymarket uses the **UMA Optimistic Oracle** for decentralized resolution.

Important flow:

1. anyone can propose a result
2. proposer posts bond, typically around `$750 pUSD`
3. there is a `2 hour` challenge period
4. if undisputed, market resolves quickly
5. if disputed, process can escalate to debate and UMA voting
6. rare fallback includes `Unknown/50-50`, where each side redeems for `$0.50`

Material implications:

- resolution is not purely venue-admin discretion
- outcome timing can be uncertain under dispute
- resolution-path risk is real, especially in ambiguous markets
- market clarifications can cause all resting orders to be cancelled

Polymarket also states that clarifications:

- cannot change the fundamental intent of the question
- are published onchain
- should be considered by proposers and voters

### Collateral and funding

Polymarket prediction markets now use **pUSD** as collateral.

Key facts:

- pUSD is a standard ERC-20 on Polygon
- backed `1:1` by USDC
- active positions carried through the 2026 exchange upgrade
- old open orders were wiped during migration

Operationally:

- users can deposit through supported chains / methods
- each account has chain-specific deposit addresses
- wrong-network deposits are not reversible by default
- withdrawals require choosing token, amount, and destination chain/address

This means treasury operations, bridging, and wallet hygiene are part of trading operations.

The account/wallet model also matters:

- modern accounts can use deposit-wallet smart-wallet rails
- legacy accounts may use proxy or safe wallet paths
- some flows can be gasless through relayer infrastructure
- pure EOA trading has different operational constraints

That affects unattended automation, recovery assumptions, and approval management.

### Authentication and APIs

Polymarket prediction-market integrations use several surfaces:

- `gamma-api.polymarket.com` for events / market discovery
- `clob.polymarket.com` for order book and trading
- `data-api.polymarket.com` for positions / activity
- WebSocket feeds for public market data and authenticated user updates

CLOB auth has two layers:

- **L1**: wallet signs an EIP-712 `ClobAuth` message
- **L2**: requests are authenticated with derived API credentials and HMAC-SHA256

This is substantially more operationally complex than Kalshi's RSA key model.

### Rate limits

Polymarket documents more than one limit regime.

At a high level there are:

- public/IP-level throttles on API surfaces
- per-signer trading buckets for order and cancel flow

Operationally this means:

- order capacity and cancel capacity are not the same resource
- trading volume tier affects effective throughput
- batch requests can still be all-or-nothing for admission
- cancel-heavy quoting strategies need explicit cancel-budget management

### Geography and access

Polymarket is materially more restrictive geographically.

Its own geoblock docs say:

- some jurisdictions are fully blocked
- some are close-only
- the United States is listed as close-only on frontend and API
- Ireland, Japan, Malta sports-only, and the Netherlands are close-only on the frontend while the API itself is not restricted for those entries
- geoblock checks are available via `https://polymarket.com/api/geoblock`

Polymarket also says users can co-locate in `eu-west-2` after KYC/KYB for the lowest latency to primary servers.

That is a very important quant detail. It means Polymarket itself acknowledges latency-sensitive participants and offers a path to reduce it.

One additional caution: official Polymarket surfaces are not perfectly consistent about jurisdiction rules. A production system should check live venue responses at runtime rather than rely only on a static copied country list.

### Quant take on Polymarket

What stands out:

- richer market-structure surface
- more idiosyncratic behavior
- stronger potential for token / resolution / inventory-driven mispricings
- maker economics can be attractive
- hybrid offchain/onchain architecture introduces edge cases traditional exchange researchers may underestimate

What to watch:

- custody and wallet risk
- geoblocking and jurisdictional restrictions
- oracle / dispute timing risk
- settlement latency and retry behavior
- market-specific taker-delay logic
- token / condition / event normalization complexity

## Kalshi vs Polymarket

### High-level contrast

| Dimension | Kalshi | Polymarket |
| --- | --- | --- |
| Regulatory posture | CFTC-regulated exchange | crypto-native hybrid venue |
| Account model | traditional account + KYC | account / wallet / signing stack |
| Market object | exchange event contracts | event -> market -> token hierarchy |
| Execution model | exchange order book | offchain signed orders + operator matching + onchain settlement |
| Position representation | venue ledger positions | ERC1155 outcome tokens |
| Collateral | account cash ledger | pUSD on Polygon |
| Resolution | venue determination + dispute lifecycle | UMA Optimistic Oracle |
| API auth | RSA-PSS signed requests | EIP-712 + derived HMAC credentials |
| Book semantics | yes/no bid representation only | explicit bids and asks per token |
| Venue complexity | lower | higher |

### Practical implication for bot design

If the goal is a fully automated research-to-execution system:

- **Kalshi-first** is easier if we want cleaner infra, simpler bookkeeping, and less wallet plumbing.
- **Polymarket-first** may offer more structural alpha, but only if we are willing to own more operational and legal complexity.
- **Cross-venue** is conceptually attractive, but normalization and jurisdiction risk are not side issues. They are the project.

## What matters for a Point72-style research workflow

### Things to model explicitly

- fee curves as a function of price
- maker vs taker economics
- order-book semantics
- market-specific tick size and minimum order size
- lifecycle state transitions
- delayed-matching regimes
- resolution and dispute timing
- collateral and treasury movements
- fill fragmentation and rounding effects

### Things to not hand-wave

- whether a quoted spread survives after fees
- whether a statistical edge survives partial-fill risk
- whether a signal is actionable under venue delays
- whether "same event" actually means same resolution rules
- whether inventory can be neutralized by split/merge instead of crossing spread
- whether legal/geographic constraints make a strategy non-deployable

## Candidate alpha buckets

These look more promising than generic headline scraping:

### 1. Internal consistency

- bucket sums not adding to `1.00`
- yes/no parity distortions
- event chains implying inconsistent joint distributions

### 2. Cross-venue relative value

- same event priced differently on Kalshi vs Polymarket
- persistent differences caused by trader-base segmentation, fees, or venue frictions

### 3. External-anchor mispricing

- finance contracts where options / spot / rates / sports books imply cleaner fair value than venue participants price in

### 4. Inventory and flow distortions

- short-lived retail order-flow imbalances
- thinner books where one-sided participation pushes implied probabilities off fair value

On Polymarket specifically, also include:

- mint / merge path effects
- neg-risk conversion structures
- reward-program distortions around quoting
- venue delay regimes that change which flow is actually actionable

### 5. Resolution / design edge

- markets where participants underweight special-rule details, clarification risk, or ambiguous resolution paths

## Research unknowns still worth validating

- exact Kalshi market-by-market special fee schedules relevant to finance-style contracts
- whether Kalshi supports all execution patterns we would want at scale through current API tiers
- Polymarket market-by-market taker-delay coverage and which categories are affected most often
- how often Polymarket clarifications and disputes materially alter practical PnL timing
- how much same-side mint / merge execution changes observed-versus-true liquidity
- how much maker rebates and liquidity rewards alter real net economics
- whether there are tractable cross-venue mappings between Kalshi financial-event contracts and Polymarket financial-event contracts
- where venue liquidity is genuinely deep versus cosmetically visible

## Initial recommendation

The best first build is not an execution bot. It is a research stack:

1. market discovery and normalization
2. order-book archival and replay
3. fee-accurate simulator
4. rule-aware contract mapping
5. hypothesis engine for mispricings
6. alerting layer

Only after that should execution automation be chosen. The correct execution design depends on whether the surviving edge is:

- passive/maker
- reactive/taker
- inventory-arb
- cross-venue hedge
- slower resolution-value capture

## Source links

### Kalshi

- Docs home: `https://docs.kalshi.com/welcome`
- Public market data quickstart: `https://docs.kalshi.com/getting_started/quick_start_market_data`
- API keys and request signing: `https://docs.kalshi.com/getting_started/api_keys`
- Rate limits: `https://docs.kalshi.com/getting_started/rate_limits`
- Market lifecycle: `https://docs.kalshi.com/getting_started/market_lifecycle`
- Market settlement: `https://docs.kalshi.com/getting_started/market_settlement`
- Order direction: `https://docs.kalshi.com/getting_started/order_direction`
- Order book endpoint: `https://docs.kalshi.com/api-reference/market/get-market-orderbook`
- Fees help page: `https://help.kalshi.com/en/articles/13823805-fees`
- Individual signup: `https://help.kalshi.com/en/articles/13823778-signing-up-as-an-individual`
- Document verification: `https://help.kalshi.com/en/articles/15581140-document-verification-on-kalshi`

### Polymarket

- API overview: `https://docs.polymarket.com/getting-started/api`
- Trading quickstart: `https://docs.polymarket.com/trading/quickstart`
- Positions and tokens: `https://docs.polymarket.com/concepts/positions-tokens`
- Order lifecycle: `https://docs.polymarket.com/concepts/order-lifecycle`
- Resolution: `https://docs.polymarket.com/concepts/resolution`
- Discover markets: `https://docs.polymarket.com/market-data/discover-markets`
- Prices and order books: `https://docs.polymarket.com/market-data/prices-order-books`
- Real-time data: `https://docs.polymarket.com/market-data/realtime-data`
- Fees: `https://docs.polymarket.com/trading/fees`
- Geographic restrictions: `https://docs.polymarket.com/api-reference/geoblock`
- Market clarification help: `https://help.polymarket.com/en/articles/13364548-how-are-markets-clarified`
- Market disputes help: `https://help.polymarket.com/en/articles/13364551-how-are-markets-disputed`
- Sign-up: `https://help.polymarket.com/en/articles/13369877-how-to-sign-up`
- Deposit: `https://help.polymarket.com/en/articles/13369887-how-to-deposit`
- Withdraw: `https://help.polymarket.com/en/articles/13369898-how-to-withdraw`
- 2026 exchange upgrade / pUSD migration: `https://help.polymarket.com/en/articles/14762452-polymarket-exchange-upgrade-april-28-2026`
