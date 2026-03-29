# Spec - Fixed Wallet Split and High Favor Costs
_Created: 2026-03-29 0105_

## Goal
Make the wallet/favor economy easier to understand and make favors feel like major purchases rather than casual pre-run toggles.

## Wallet rules
- MissionSelect should show a simple `WALLET` line above the favor grid.
- Remove the extra economy summary line from MissionSelect.
- Successful extraction always pays the player `60%` of extracted credits into the wallet.
- Slick always keeps `40%`.
- The wallet split is fixed from the start of the game. No scaling, deal tiers, or progression track.

## Favor pricing
- Basic favors should cost several successful exfils, not one good run.
- Favor costs are intentionally high:
  - `DEEPCORE`: `8000c`, `18000c`, `32000c`
  - `RECLAIM`: `8000c`, `18000c`, `32000c`
  - `IRONVEIL`: `9000c`, `20000c`, `36000c`
  - `FREEPORT`: `7500c`, `16500c`, `29000c`

## Results copy
- Extraction results should use plain language and fixed percentages.
- Show wallet gain, wallet total, and the fixed `60/40` split clearly.
- Do not show progression copy about future better deals.

## Persistence
- Save data still persists wallet credits and best score.
- Any old save fields tied to Slick-deal progression are ignored.

## Out of scope
- Rebalancing mission rewards in this pass
- Adding debt, discounts, or negotiation mechanics
- Per-company payout deals
