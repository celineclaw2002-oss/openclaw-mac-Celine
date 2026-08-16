# FFA Quant Research - 2026-08-16

## Summary

Built a durable FFA research memo in the Mission Control Vault, modeled after the earlier prediction-markets work but focused on freight derivatives, physical-market structure, and a concrete first alpha thesis.

## Decisions

- Treat FFAs as a **physical-inventory and term-structure problem**, not a generic price-forecasting problem.
- Prioritize **one narrow segment first** rather than “all freight.”
- Favor **nearby calendar spreads, route spreads, and basket-vs-route relative value** before outright directional bets.
- Anchor the initial edge on **latent vessel-inventory imbalance plus cargo-flow nowcasting**.

## Work completed

- Reviewed the existing prediction-markets research structure and Vault conventions.
- Researched FFA contract structure, clearing, settlement, liquidity, and academic findings around:
  - cointegration and unbiasedness
  - price discovery
  - liquidity effects
  - term-structure modeling
  - AIS-driven freight analytics
- Wrote the main Vault memo:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-quant-research-breakthrough-2026-08-16.md`

## Current conclusions

- The most interesting first FFA edge is likely **not** generic outright forecasting.
- The strongest initial thesis is a **route-level tightness engine** that estimates prompt reachable ballast supply, congestion-adjusted capacity, and cargo-flow pressure.
- The best first tradable expressions are likely:
  - `M1-M2` calendar spreads
  - route spreads within a vessel class
  - basket-vs-route relative value
- Shipping contacts could add real value by improving:
  - route selection
  - interpretation of AIS and congestion data
  - confidence in whether a dislocation is economically real

## Important files

- Main Vault memo:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-quant-research-breakthrough-2026-08-16.md`

## Open questions

- Which segment should be the first live research target:
  - Capesize dry bulk
  - Panamax dry bulk
  - one tanker complex
- Which commercial data stack is most realistic for an initial pilot?
- Do Can's contacts have:
  - route-specific expertise
  - data access
  - execution relationships
  - potential capital interest
- What compliance constraints would apply once Morgan Stanley onboarding is complete?

## Next steps

1. Write a segment-selection memo comparing Capesize, Panamax, and one tanker complex.
2. Draft the feature schema for the latent-tightness engine.
3. Build a 30-day pilot plan covering data, backtest design, and partner conversations.
4. Turn the shipping-contact list into a structured outreach plan by segment and role.
