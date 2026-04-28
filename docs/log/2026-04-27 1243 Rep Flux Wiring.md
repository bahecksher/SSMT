# 2026-04-27 1243 Rep Flux Wiring

## TL;DR
- What changed: added end-of-run rep flux. New `RepFluxSystem` tracks player-credited kills + per-frame salvage/mining income during a run, computes per-corp deltas at extract or death (Reclaim/Deepcore +1 per 200 banked, Iron Veil +1 per 5 kills with -1 per kill to each rival corp while affiliated, Free Port +1 on extract / -2 on death), applies them to the persisted rep save (clamped at 0), and renders a single `REP +N CORP, -N CORP` line on the result panel.
- Why: Phase 3 of the Affiliation Bonus + Campaign Lives plan. Mission rep alone wasn't enough to drive corp loyalty; players need passive rep gain (extracting credits, killing things) and active rep loss (dying, betraying rivals via Iron Veil work).
- What didn't work: nothing — single-pass implementation, build green first try.
- Next: browser playtest to confirm deltas surface correctly and that Iron Veil rival cost isn't too punishing in practice. Then move on to Campaign mode + lives + GameOver tally.

---

## Full notes

### Tuning numbers (placeholders, locked from plan)
- `salvageCreditsPerRep: 200` — +1 RECLAIM per 200 salvage credits taken in (run total). Awarded on extract only.
- `miningCreditsPerRep: 200` — same for DEEPCORE.
- `ironVeilKillsPerRep: 5` — +1 IRONVEIL per 5 player-credited kills, only while IRONVEIL is the player's affiliated corp.
- `ironVeilRivalRepCostPerKill: 1` — each kill subtracts 1 rep from each of DEEPCORE / RECLAIM / FREEPORT, only while IRONVEIL-affiliated.
- `ironVeilRivalRepCostCapPerRun: 3` — total rep loss per rival corp from IRONVEIL kill tax is capped at 3 per run. Added in follow-up after initial spec felt too punishing on heavy-kill runs.
- `freePortExtractRep: 1` — +1 FREEPORT on any successful extract (cap 1/run, naturally satisfied since extract ends the run).
- `freePortDeathRep: 2` — -2 FREEPORT on any death.

### Files changed
- `src/game/systems/RepFluxSystem.ts` — NEW. `RepFluxTracker` class (kills + salvage/mining income accumulators), `computeDeltas(outcome, affiliatedCompanyId)` returns a `RepDeltaMap`, `applyRepDeltas` mutates persisted save and returns the *applied* delta (clamped at 0) so the UI shows the real change rather than the requested change. `formatRepDeltasOneLine` renders `REP +3 RECLAIM, -2 IRONVEIL`. `REP_FLUX_TUNING` block is the single source of truth for numbers.
- `src/game/scenes/GameScene.ts` — instantiates `RepFluxTracker` next to `MissionSystem`. Hooks `repFluxTracker.trackPlayerKill()` at all four `trackNpcKill`/`trackEnemyKill` call sites: NPC ram via shield (~line 754), boss core breach via shield (~line 793), enemy ram via shield (~line 866), and `clearBoard` enemy clears (bomb board-wipe, ~line 1998). Pipes `frameSalvage`/`frameMining` from `SalvageSystem` into `repFluxTracker.trackSalvageIncome`/`trackMiningIncome` next to the existing mission-tracker calls. `handleExtraction` and `handleDeath` both call `computeDeltas` → `applyRepDeltas`, gated on `!scoreRecordingBlocked` (debug runs do not mutate persisted rep). Extends `ResultData` with optional `repFluxDeltas: RepDeltaMap`. `showResultUi` renders a single HUD-color line under the existing mission-rep summary inside the missions block — only when `formatRepDeltasOneLine` returns non-null.

### Design decisions
- **Affiliation lookup** uses `this.affiliatedCompanyId` (already set in `create()` via `getLeaderboardCompanyId(loadCompanyRep())`), which falls back to the highest-rep corp when no explicit menu pick exists. Matches the rep-panel ACTIVE marker on MissionSelect — if Iron Veil is your top corp, you pay the Iron Veil tax even without explicitly selecting them.
- **`applied` vs `requested` delta**: `applyRepDeltas` clamps each corp at 0 and returns the actual change applied. Surfacing the `applied` delta means a player at 1 rep with a corp who would be hit for -3 sees `-1` (not `-3`) on the result screen, matching what actually happened. No "phantom" losses.
- **Banked-source rep on extract only**: salvage/mining +1-per-200 ticks only fire on `extract` outcome. Death = no salvage/mining rep, regardless of how much was taken in. Matches the plan's "credits banked" wording — credits aren't actually banked unless the player extracts.
- **Free Port mechanic** is symmetric: extract → +1, die → -2. Punishes runners, rewards extractors. Per the plan's "leave for v2 if too punishing", I shipped as written.
- **Iron Veil rival tax** is per-kill, per-corp. 8 kills + a death while Iron Veil-affiliated = `+1 IRONVEIL, -8 DEEPCORE, -8 RECLAIM, -8-2 = -10 FREEPORT`. This is harsh but matches the spec; flagging in state.md Known Issues for live tuning.
- **Result UI placement**: a single line directly under the existing `COMPANY REP GAINED: +N` summary, inside the missions block. Color = `COLORS.HUD` (neutral) — not green/red. The deltas already include their own +/- signs, so color is informational rather than directional.
- **No new types in `types.ts`**: `RepDeltaMap` lives in `RepFluxSystem.ts` and is re-exported as a type-only import in GameScene.

### Verification
- `npm.cmd run build` → clean (TypeScript + Vite, 697ms). No warnings, no unused imports.
- Browser playtest is queued as the top "Next action" in `state.md` — the math should be straightforward to verify by running affiliations against extract vs. death paths.

### Notes for next session
- `SaveSystem` still has `setCampaignFavorIds`, `favorIds` on `CampaignSessionSave`, and the normalizer reads `parsed.favorIds`. Still leaving alone — they'll be cleaned up when the Campaign session lives system is rebuilt next pass.
- If Iron Veil's per-kill rival tax feels too punishing in playtest, the obvious knobs are: (a) raise `ironVeilKillsPerRep` to 3 so kills earn IRONVEIL faster, (b) drop `ironVeilRivalRepCostPerKill` to 1 every-2-kills (would need a divisor), or (c) cap rival cost per run.
- Mission rep is still applied independently by `MissionSystem.claimAndClear()` and surfaced as `COMPANY REP GAINED: +N`. Two separate visual lines for two separate concepts (mission contracts vs. behavioral flux). If this becomes confusing, future pass could merge them.
