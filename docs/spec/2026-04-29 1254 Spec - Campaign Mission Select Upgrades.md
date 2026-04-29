# Spec - Campaign Mission Select Upgrades
_Created: 2026-04-29 1254_

## Goal
Expand campaign Mission Select spending with buyable lives and paid phase starts, make arcade rerolls free again, and restore cross-arena beam pressure during phase 10+ boss play.

## Requirements
- Campaign Mission Select should keep the existing reroll flow and add a `+1 LIFE` purchase for `10000c`.
- Buying a campaign life should permanently increase the current campaign session's remaining lives.
- Campaign Mission Select should let the player choose a paid starting phase for the next deploy.
- Starting phase pricing should be:
  - phase 2: `1000c`
  - phase 3: `3000c`
  - phase 4: `4000c`
  - phase 5+: `phaseNumber * 1000c`
- A paid phase start only applies to the next deployed run and should not become a permanent campaign unlock.
- The phase selector should stay within the currently meaningful phase range of the game.
- Arcade rerolls should no longer spend wallet credits, but the per-visit reroll cap of 3 should remain.
- Phase 10+ should keep the gunship boss and also resume the cross-arena beam hazard pressure used in earlier late-game phases.

## Out of scope
- Reworking the versus feature set
- Rebalancing company buffs beyond the reroll and campaign-purchase changes in this request
- New campaign-specific save slots, currencies, or unlock trees
