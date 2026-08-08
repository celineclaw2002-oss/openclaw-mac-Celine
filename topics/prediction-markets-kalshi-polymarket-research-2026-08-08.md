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
- Built five detailed alpha-bucket research memos in the Mission Control Vault:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Prediction Markets/1-internal-consistency-research.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Prediction Markets/2-cross-venue-relative-value-research.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Prediction Markets/3-external-anchor-mispricing-research.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Prediction Markets/4-inventory-and-flow-distortions-research.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Prediction Markets/5-resolution-and-design-edge-research.md`

## Current conclusions

- `Internal consistency` looks like the strongest structural bucket, especially partitions, ladders, temporal nesting, and Polymarket combo or synthetic inconsistencies.
- `External-anchor mispricing` looks strong when scoped narrowly to objective finance-linked contracts such as Fed, CPI, jobs, and BTC threshold markets.
- `Cross-venue relative value` is real but should be treated as a constrained pilot because legal deployability, overlap, and hedgeability are likely binding.
- `Inventory and flow distortions` looks promising as a microstructure sleeve rather than the whole strategy franchise.
- `Resolution and design edge` looks real but niche: likely high-alpha, lower-frequency, and hard to scale, especially around Polymarket clarifications, neg-risk design, and dispute timing.

## Important files

- Main research note:
  - `/Users/canozgel-macmini/.openclaw/workspace/10 Research/prediction-markets-kalshi-polymarket-primer-2026-08-08.md`
- Alpha-bucket vault folder:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Prediction Markets`

## Open questions

- Which venue should be the first live research target: Kalshi, Polymarket, or both?
- Which specific contract families map cleanly to external fair-value anchors?
- What are the legal/compliance constraints around personal trading and automated prediction-market activity post-Morgan Stanley onboarding?
- How much latency sensitivity do we actually want to own in v1?

## Next steps

1. Convert the five memos into a ranked research agenda with explicit hypotheses and kill criteria.
2. Build a market taxonomy and contract-normalization layer for Kalshi and Polymarket.
3. Design the capture schema for books, trades, fees, rewards, lifecycle events, and resolution metadata.
4. Prioritize a Phase I backtest around internal consistency plus external-anchor markets, with resolution and cross-venue overlays.
