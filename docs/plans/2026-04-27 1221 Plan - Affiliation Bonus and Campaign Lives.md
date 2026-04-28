# Plan - Affiliation Bonus and Campaign Lives
_Created: 2026-04-27 1221_

## Goal
Six-part overhaul:
1. Kill MissionSelect favors — replace with static company bonus driven by main-menu corp pick + rep level.
2. Lock Liaison/Slick/Regent dialogue boxes to the selected corp only.
3. Re-add Campaign mode (alongside Quick Play) with a 2-life system, full arena soft-reset on death, persisting extracted credits, and a Game Over tally.
4. Replace favor cards with a 4-bar reputation panel on MissionSelect; rep flux comes from kills, extracts, and missions.
5. Add a How To Play screen accessible from the main menu.
6. Change countdown phrases to "GET IN / GET YOURS / GET OUT / GO".

## Approach

### Phase 1 — Trivial wins
- `GameScene.ts:113` `COUNTDOWN_PHRASES` swap to `['GET IN', 'GET YOURS', 'GET OUT', 'GO']`.
- Verify single source of truth (no duplicated phrase array elsewhere).

### Phase 2 — Affiliation bonus model
- New helper in `companyData.ts`: `getRunBoostsFromAffiliation(companyId | null, repSave): RunBoosts`.
  - Picks one company. Looks up that company's rep level. Applies that single column from the existing multiplier tables.
  - If `companyId == null` → neutral boosts.
- Iron Veil bonus changes: instead of `npcBonusMult` (pickup mult), Iron Veil grants a flat **score multiplier** on all credits banked. Add new field `RunBoosts.scoreMult` (default 1.0). Wire `scoreMult` into the score-bank path in `BankingSystem` / `ScoreSystem`.
- Free Port: keep `bonusDropChanceAdd` (shields/bombs).
- Reclaim: keeps `salvageYieldMult`.
- Deep Core: keeps `miningYieldMult`.
- Delete `computeRunBoostsFromFavors`, `getFavorOffer`, `CompanyFavorOffer`, `FAVOR_COST_BY_LEVEL`, `formatBoost`/`getFavorCost` once nothing references them.
- `MissionSelectScene` calls `getRunBoostsFromAffiliation` instead of the favor compute, passes through to GameScene handoff unchanged.

### Phase 3 — Rep flux rules (proposed tuning)
All rep is integers, applied in MissionSystem / BankingSystem / collision callbacks. Save via `saveCompanyRep`.

| Action | Affected | Amount |
|--------|----------|--------|
| Mission completed (existing) | mission.company | `REP_PER_TIER[tier]` (1/2/4) |
| Extract any credits | FREEPORT | `+1` per extract (cap 1/run) |
| Death without extract this run | FREEPORT | `-2` |
| Salvage credit banked | RECLAIM | `+1` per 200 salvage credits banked (run total) |
| Mining credit banked | DEEPCORE | `+1` per 200 mining credits banked (run total) |
| NPC/enemy kill while affiliated to IRONVEIL | IRONVEIL | `+1` per 5 kills |
| NPC/enemy kill while affiliated to IRONVEIL | DEEPCORE, RECLAIM, FREEPORT | `-1` per kill (other corps hate it) |
| Mission completion against a non-affiliated corp | other corp | `-1` (light penalty) — leave for v2 if too punishing |

These numbers are placeholders. We'll tune live.

End-of-run: compute deltas in `GameScene`, apply once on RESULTS state, surface in result UI ("REP +2 RECLAIM, -1 IRONVEIL" lines).

### Phase 4 — Comm gating
- `GameScene.create`: only instantiate `LiaisonComm`, `SlickComm`, `RegentComm` if there's an `openingCompany` matching the player's selected affiliation. Each comm reads only its own corp's lines via existing data files (already corp-keyed for liaison, but Slick/Regent lines may need filtering — verify).
- If no corp is selected (null affiliation), no comms open at all.
- All other comms skip showing during the run.

### Phase 5 — Rep bar UI (MissionSelect)
- New module `src/game/ui/RepBarPanel.ts`: 4 stacked rows, each row: corp logo color, name, current rep, level label, bar fill (0→nextRepRequired). Highlight selected corp row.
- Place where favor cards lived (MissionSelectScene lines ~860-1019). Recompute layout to fit.

### Phase 6 — Campaign mode + lives
- `MenuScene`: add Campaign / Quick Play toggle pair near company selector. Selection persists via existing `SaveData.selectedMode`.
- `CampaignSessionSave`: extend to `{ livesRemaining, totalExtracted, missionsCompleted }`. Drop the unused `favorIds`.
- New campaign flow:
  - Start: `MenuScene` "Begin Campaign" → MissionSelect → GameScene → run.
  - Death during run, `selectedMode === CAMPAIGN`, `livesRemaining > 0`: decrement lives, soft-reset arena (clear hazards/bullets/enemies, respawn ship at center, keep current phase counter, reset in-arena unbanked score to 0, keep `totalExtracted`). Show a brief "LIFE LOST — N REMAINING" overlay.
  - Death with `livesRemaining == 0`: GameOver tally screen (campaign total extracted, missions done, rep changes), submit row to leaderboard with `mode='CAMPAIGN'`, clear `campaignSession`, return to MissionSelect.
  - Successful extract (campaign): bank to `campaignWalletCredits`, `totalExtracted += extracted`, return to MissionSelect with lives unchanged.
- Quick Play: identical to existing arcade/single-run flow today.

### Phase 7 — Leaderboard column
- Add `mode` column to `scores` table (and optionally `losses`) Supabase-side. Submission tags `'QUICK'` or `'CAMPAIGN'`. Filter UI later.
- Until column exists in DB, gracefully fall back (mirror existing `isMissingCompanyColumnError` pattern).
- **User action required**: SQL migration on Supabase. We'll document the exact column add in the log and Known Issues.

### Phase 8 — How To Play
- New `HowToPlayScene` (or modal overlay on MenuScene). Three short pages:
  1. **MOVE** — controls (mouse/touch).
  2. **EXTRACT** — gates open, race in, bank credits before death.
  3. **REP** — pick a corp, do their work, get bonuses; betraying others costs rep.
- Menu button: "HOW TO PLAY".

## Scope boundaries
- No new audio assets, no new music, no new corp art.
- No retroactive leaderboard backfill — existing rows stay un-tagged.
- No tuning second-pass for rep numbers — ship the placeholders, iterate later.
- No rewrite of comm data files — only the gating.
- No mobile-specific tweaks; MissionSelect rep panel will reuse the favor card region's responsive sizing.
- Tauri packaging path stays paused at "user installs Rust" — unrelated.

## Open questions
- Slick/Regent lines may currently mention every corp; if the dialogue files are corp-tagged, filter is trivial; if monolithic, we may need a lightweight tagging pass. Verify in implementation.
- Rep bar visual: bars per corp could be too tall for current MissionSelect layout — may need a more compact horizontal strip.
- Soft-reset on death: BeamHazard / DrifterHazard may have lingering tweens; need to call each system's `reset()` rather than just clearing entities.
- Do we want a "FORFEIT CAMPAIGN" button on MissionSelect to abandon a session early? Not in scope here unless needed.

## Implementation order (sessions)
1. **Today**: countdown swap + plan + state update. Push small.
2. **Next**: affiliation-bonus refactor + delete favor system + comm gating.
3. **Next**: Rep bar UI + rep flux wiring.
4. **Next**: Campaign mode + lives system + GameOver tally.
5. **Next**: Leaderboard column + How To Play screen.

Each session ends with `npm.cmd run build` green, state.md rewrite, log file.
