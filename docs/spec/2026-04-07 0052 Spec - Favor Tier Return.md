# Spec - Favor Tier Return
_Created: 2026-04-07 0052_

## Goal
Restore standing-based favor progression now that campaign favors can carry between runs, and make favor boost copy read consistently at a glance.

## Core changes
- Company favors are locked while a company is `UNKNOWN`.
- Reaching `KNOWN`, `TRUSTED`, and `ELITE` unlocks favor tiers 1, 2, and 3 respectively.
- Favor prices are standardized across companies:
  - `KNOWN`: `1000c`
  - `TRUSTED`: `2000c`
  - `ELITE`: `3000c`
- Favor boost text uses percentage formatting everywhere:
  - mining / salvage bonuses show as `+15%`, `+30%`, `+50%`
  - NPC bounty shows as `+50%`, `+100%`, `+200%`
  - bonus drop chance remains `+10%`, `+20%`, `+30%`
- MissionSelect should dim locked favor cards and show the `KNOWN` unlock threshold directly on the card.

## Persistence
- Campaign favor persistence still tracks favored companies by company ID rather than storing a separate purchased sub-tier.
- As a result, a carried favor uses that company's current unlocked standing tier on the next run.

## Out of scope
- Rebalancing the boost magnitudes themselves
- Adding a separate per-favor upgrade purchase state
- Reworking favor layout beyond the locked-card feedback needed for this restore
