# 2026-03-28 2357 Wallet Favors Economy

## TL;DR
- What changed: added a persistent wallet payout on extraction, replaced passive reputation boosts with purchasable company favors, and surfaced Slick's cut in the extract results UI
- Why: company advantages should be a player choice with real cost, and only part of extracted credits should become spendable money
- What didn't work: the results retry path initially dropped purchased favor boosts, and `GameScene` briefly read the run handoff before it was defined
- Next: playtest the 35% payout rate, tune favor costs, and decide whether extract retry should eventually route back through MissionSelect

---

## Full notes

- Added `walletCredits` to save data plus deposit/spend helpers in `SaveSystem`.
- Reworked `companyData.ts` so reputation unlocks tiered favor offers instead of auto-granting passive boosts.
- MissionSelect now shows wallet totals and a 2x2 company favor grid with locked, available, and active states.
- Deploy spends wallet credits once and passes only the purchased boosts into `GameScene`.
- Extraction deposits 35% of final extracted credits into wallet, keeps the full extracted score for leaderboard/best-score purposes, and shows Slick's 65% cut on the result screen.
- Death retry now preserves the active favor loadout; extraction retry starts with no carried favor spend.
- Verified with `npm.cmd run build`.
