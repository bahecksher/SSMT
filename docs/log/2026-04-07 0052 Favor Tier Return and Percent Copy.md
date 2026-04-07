# 2026-04-07 0052 Favor Tier Return and Percent Copy

## TL;DR
- What changed: restored standing-based favor tiers, set favor prices to `1000c / 2000c / 3000c`, and normalized favor boost copy to percentage format
- Why: campaign favors can now persist between runs, so bringing back tiered offers makes that economy more meaningful and the card copy easier to scan
- What didn't work: nothing blocked this pass once MissionSelect was updated to handle locked favors again
- Next: decide whether carried campaign favors should keep following current standing or store an exact purchased tier

---

## Full notes

- Updated `src/game/data/companyData.ts` so favor offers are once again gated by company standing instead of a fixed tier-2 offer.
- Standardized favor costs across companies to `1000c` at `KNOWN`, `2000c` at `TRUSTED`, and `3000c` at `ELITE`.
- Swapped the display text for mining, salvage, and NPC bounty favors from multiplier notation like `x1.15` to percentage notation like `+15%`.
- Updated `src/game/scenes/MissionSelectScene.ts` so locked favor cards show `KNOWN AT 3 REP`, dim visually, and cannot be selected.
- Kept carried campaign favors as company-ID persistence, which means they currently pick up the company's latest unlocked tier on future runs.
- Verified with `npm.cmd run build`.
