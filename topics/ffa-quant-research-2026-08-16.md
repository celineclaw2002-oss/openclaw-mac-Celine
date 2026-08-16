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
- Wrote three separate pre-testing blueprints in the Vault:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-blueprint-01-prompt-calendar-spread-2026-08-16.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-blueprint-02-intra-class-route-spread-2026-08-16.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-blueprint-03-basket-vs-route-rv-2026-08-16.md`
- Added the next layer of remote-prep execution documents:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-segment-selection-memo-2026-08-16.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-30-day-pilot-plan-2026-08-16.md`

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
- After a final blueprint pass, the three ideas now rank as:
  1. prompt calendar-spread tightness strategy
  2. intra-class route-spread relative value
  3. basket-vs-route residual value
- Key refinement from the earlier memo:
  - these are no longer treated as merely three expressions of one signal
  - they are now framed as three distinct alpha programs sharing one physical-state data stack but requiring different target design, validation, execution, and kill criteria
- Segment-selection conclusion after the next pass:
  - `Capesize dry bulk` first
  - `Panamax` second
  - tanker later unless Can's contact edge is clearly tanker-heavy

## Important files

- Main Vault memo:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-quant-research-breakthrough-2026-08-16.md`
- Blueprint Vault notes:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-blueprint-01-prompt-calendar-spread-2026-08-16.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-blueprint-02-intra-class-route-spread-2026-08-16.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-blueprint-03-basket-vs-route-rv-2026-08-16.md`
- Segment and pilot notes:
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-segment-selection-memo-2026-08-16.md`
  - `/Users/canozgel-macmini/MissionControlVault/10 Research/Freight and FFAs/ffa-30-day-pilot-plan-2026-08-16.md`

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

1. Build the shared physical-state feature schema that all three blueprints depend on, now explicitly for a Capesize-first pilot.
2. Build the data-vendor comparison against that schema.
3. Start testing in rank order:
   - Blueprint 01 first
   - Blueprint 02 second
   - Blueprint 03 third
4. Use the 30-day pilot plan to sequence the first build.
5. Turn the shipping-contact list into a structured outreach plan by segment and role.
6. Ask Can for actual contact names so the outreach scaffold can be made concrete.
