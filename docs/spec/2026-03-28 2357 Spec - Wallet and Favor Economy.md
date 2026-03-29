# Spec - Wallet and Favor Economy
_Created: 2026-03-28 2357_

## Goal
Turn company progression into a spend-or-save decision by replacing passive rep boosts with a persistent wallet and pre-run favors.

## Core loop changes
- Successful extraction still uses the full final extracted credits for score, best score, and leaderboard submission.
- Extraction also deposits 35% of the final extracted credits into a persistent wallet. Slick keeps the remaining 65%.
- Company reputation no longer grants automatic boosts on deploy. Reputation unlocks favor tiers instead.
- MissionSelect becomes the place where the player chooses which unlocked favors to buy for the next run.
- Runs remain fully playable with no favors selected.

## MissionSelect flow
- Keep the existing three contract cards and reroll button.
- Add a favor section below rerolls showing all four companies.
- Show `WALLET`, `COMMITTED`, and `LEFT` values at the top of that section.
- Each favor card shows the company name, unlocked boost, rep label, and either a cost or a locked-state message.
- Selecting favors commits their costs for the next deployment.
- Deploy spends the committed wallet amount once and passes the selected boosts into gameplay.

## Company favors
- `DEEPCORE`: mining yield
  - `KNOWN` `x1.15` for `120c`
  - `TRUSTED` `x1.30` for `240c`
  - `ELITE` `x1.50` for `420c`
- `RECLAIM`: salvage yield
  - `KNOWN` `x1.15` for `120c`
  - `TRUSTED` `x1.30` for `240c`
  - `ELITE` `x1.50` for `420c`
- `IRONVEIL`: NPC bounty
  - `KNOWN` `x1.5` for `150c`
  - `TRUSTED` `x2.0` for `300c`
  - `ELITE` `x3.0` for `520c`
- `FREEPORT`: bonus drop chance
  - `KNOWN` `+10%` for `100c`
  - `TRUSTED` `+20%` for `200c`
  - `ELITE` `+30%` for `360c`

## Results and retry behavior
- Extraction results show the final score, wallet payout, total wallet balance, and Slick's cut.
- Death retry keeps the purchased favor loadout active for that retry.
- Extraction retry starts a fresh run without carrying favor purchases forward.
- Returning to menu / MissionSelect is the path for changing contracts or buying a new favor mix after a successful run.

## Persistence
- `SaveSystem` stores `bestScore` and `walletCredits`.
- Existing saves migrate by defaulting missing `walletCredits` to `0`.
- Company reputation persistence remains unchanged and still advances from completed contracts.

## Out of scope
- Dynamic pricing, debt, interest, or wallet penalties
- Favor cooldowns or favor-specific audiovisual effects
- Backend wallet sync or account systems
