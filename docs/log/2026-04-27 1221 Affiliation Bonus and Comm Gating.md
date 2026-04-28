# 2026-04-27 1221 Affiliation Bonus and Comm Gating

## TL;DR
- What changed: countdown text now reads "GET IN / GET YOURS / GET OUT / GO". Favor system fully removed from MissionSelect; replaced with a 4-row rep panel that displays each corp's level + progress bar + bonus value. In-run boosts come from the selected affiliation only. Iron Veil's bonus is now a banked-score multiplier (`scoreMult`) instead of a per-pickup mult. The corp NPC liaison comm is now locked to the player's selected affiliation; Slick + Regent stay universal because their line files are corp-agnostic.
- Why: opening salvo of the user's "kill favors, give static corp bonuses, only show the appropriate NPC dialogue" pass. Plan file written and locked before code; rep flux + Campaign + lives + Game Over + How To Play are scoped for follow-up sessions per the plan's implementation order.
- What didn't work: nothing — single chunk of changes, build green on the second attempt after stripping two unused imports (`CompanyId`, `createCompanyLogo`).
- Next: browser playtest the new flow, then move to rep flux wiring next session.

---

## Full notes

### Plan
- New plan: `docs/plans/2026-04-27 1221 Plan - Affiliation Bonus and Campaign Lives.md`. Covers all six asks the user listed. Implementation order is intentionally staged — only Phases 1, 2, 4 (countdown swap, favor refactor, comm gating) plus a stripped-down Phase 5 (rep panel UI) shipped this session.

### Tuning answers locked
- 2 lives default, full arena reset on death w/ phase preserved and arena score reset, Campaign + Quick Play both modes, propose tuning, Iron Veil = score multiplier + rep loss for other corps per kill, Free Port = drop chance add, Campaign needs separate leaderboard column, Slick/Regent universal but corps locked, How To Play accessible from menu always.

### Files changed
- `src/game/scenes/GameScene.ts` — countdown phrase array; liaison gating swapped from random-from-accepted-contracts to player's selected affiliation; `scoreSystem.setScoreMult(...)` applied at run start; `difficultySystem.setBoosts` call updated to single argument; added `getCompanyAffiliation` import.
- `src/game/types.ts` — `RunBoosts` now `{ miningYieldMult, salvageYieldMult, scoreMult, bonusDropChanceAdd }`; `CompanyFavorOffer` deleted.
- `src/game/data/companyData.ts` — `IRONVEIL_NPC_MULT` renamed to `IRONVEIL_SCORE_MULT` (1.0/1.15/1.30/1.50). `FAVOR_COST_BY_LEVEL`, `getFavorOffer`, `computeRunBoostsFromFavors`, `formatBoost`, `getFavorCost` all deleted. New: `getRunBoostsFromAffiliation(repSave)` and `getCompanyBoostDisplay(companyId, level)`. `createNeutralRunBoosts` made `export`. `applyCompanyBoost` now writes to `boosts.scoreMult` for Iron Veil. Iron Veil `boostLabel` is now `'SCORE MULT'`.
- `src/game/systems/ScoreSystem.ts` — added `scoreMult` field, `setScoreMult(value)`, and multiplied `unbanked * scoreMult` inside `bankScore()`.
- `src/game/systems/DifficultySystem.ts` — dropped `npcBonusMult` field, simplified `setBoosts(bonusDropChanceAdd)`, removed all `* this.npcBonusMult` from ENEMY_BONUS_POINTS and NPC_BONUS_POINTS award lines.
- `src/game/scenes/MissionSelectScene.ts` — removed favor imports, `selectedFavorIds`/`carriedFavorIds` state, the entire `drawFavorSection` + `drawFavorBadge` blocks, the `setCampaignFavorIds` call, `getSelectedFavorCost`/`getWalletCreditsAfterSelectedFavors`. Renamed layout fields `favor*` → `rep*`. Added `drawRepPanel` (one row per corp: name+standing label, current/next rep, bar fill, bonus row, ACTIVE flag for the selected corp). Removed unused imports (`CompanyId`, `createCompanyLogo`).

### Notes for next session
- `SaveSystem` still has `setCampaignFavorIds`, `favorIds` on `CampaignSessionSave`, and the normalizer reads `parsed.favorIds`. Leaving these alone for now — they'll be cleaned up when the Campaign session is rebuilt next pass (replacing `favorIds` with `livesRemaining` + `totalExtracted` per the plan).
- `setCampaignFavorIds(...)` no longer has any caller. Safe to delete in the campaign session.
- `MAX_REROLLS` and `REROLL_BASE_COST` still in use; `REP_PER_TIER` still used by `drawCard` for the per-mission rep-gain badge.
- `getCompanyBoostDisplay` is now the canonical "what does this corp give you?" formatter. Used in the rep panel; will be reused on the menu/how-to-play screen.

### Verification
- `npm.cmd run build` → clean (TypeScript + Vite, ~715ms). Two intermediate failures about unused imports were resolved by deleting them.
- No browser playtest yet — that's an explicit next action in `state.md`.
