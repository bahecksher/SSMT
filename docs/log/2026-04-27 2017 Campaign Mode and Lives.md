# 2026-04-27 2017 Campaign Mode and Lives

## TL;DR
- What changed: Campaign mode is now playable end to end. MenuScene exposes a tap-toggle ARCADE ↔ CAMPAIGN switch on the existing mode-status row. A campaign session carries 2 lives + missionsCompleted + totalExtracted; favorIds is gone from the type, normalizer, and SaveSystem. On death with lives remaining, the arena soft-resets (board clear w/o kill credit, player respawn at start, unbanked dropped, 2.5s invuln, LIFE LOST overlay). On final death, the GameOver tally renders + the campaign total (`totalExtracted` at moment of GameOver) is submitted to the leaderboard. Extract on campaign tallies into `totalExtracted` and routes the `NEXT RUN` button back to MissionSelect (lives unchanged) instead of restarting GameScene.
- Why: Phase 4 of the Affiliation Bonus + Campaign Lives plan. Plan was queued explicitly: rep flux done last session, this session pulls Campaign mode + lives + GameOver tally.
- What didn't work: nothing — single-pass implementation, build green on second try after adding `campaignTotalExtracted` to the `ResultData` interface. Rest of the changes compiled clean.
- Next: browser playtest the campaign loop, then leaderboard `mode` column + How To Play screen.

---

## Full notes

### Files changed
- `src/game/types.ts` — `CampaignSessionSave` shape rebuilt: `{ livesRemaining, missionsCompleted, totalExtracted }`. `favorIds: CompanyId[]` removed.
- `src/game/systems/SaveSystem.ts` — dropped `CompanyId` + `isCompanyId` import (no longer needed), added `isRunMode` import. `setSelectedMode` no longer filters CAMPAIGN to ARCADE. `normalizeCampaignSession` reads `totalExtracted` instead of `favorIds`. `ensureCampaignSession` / `startNewCampaignSession` write the new shape. `getCampaignSession` returns a shallow clone via spread. New `getCampaignTotalExtractedDisplay()` and `addCampaignExtractedCredits(amount)` helpers. `setCampaignFavorIds` deleted entirely. Existing `consumeCampaignLife` + `addCampaignMissionCompletions` unchanged in behavior.
- `src/game/scenes/MenuScene.ts` — removed forced `setSelectedMode(ARCADE)` on entry. `modeStatusText` is now interactive (tap toggles ARCADE ↔ CAMPAIGN, plays UI select sfx, refreshes via `updateModeUi`). `updateModeUi` rewrites itself for the active mode and reads campaign session live (lives + totalExtracted) when present. DEPLOY now reads `getSelectedMode()`, calls `ensureCampaignSession()` if CAMPAIGN, and passes the actual mode through the handoff to MissionSelect.
- `src/game/scenes/MissionSelectScene.ts` — `runMode = handoff.mode ?? saveSystem.getSelectedMode()` (was hardcoded ARCADE). `ensureCampaignSession()` if mode is CAMPAIGN. Existing `getModeSubtitle` and `getWalletHeader` already render the right strings for CAMPAIGN — no changes needed there. The earlier rep-row-height cap (44/50/56) from this session's UI fix stays.
- `src/game/entities/Player.ts` — added `respawn(x, y)` method that resets position, velocity, shield, heading (to up), shieldPulse, destroyed visual, and graphic alpha. Used by GameScene's soft-respawn path.
- `src/game/scenes/GameScene.ts`:
  - Reads `handoff.mode ?? saveSystem.getSelectedMode()` (was hardcoded ARCADE) and ensures a campaign session if CAMPAIGN.
  - Imports `submitScore` alongside `submitLoss`.
  - `handleDeath` restructured: captures `totalExtractedBefore` from the session prior to consuming a life. CAMPAIGN + !gameOver sets a `campaignSoftRespawn` flag — rep flux is **not** applied (run hasn't ended), `setResultMusic` is skipped, the screenWipe callback routes to `softRespawnForCampaign(livesRemaining)` instead of `enterResultsState()`. CAMPAIGN + gameOver applies rep flux as `'death'` and submits the campaign total to the leaderboard via `submitScore`.
  - New `softRespawnForCampaign(livesRemaining)`: calls `clearBoard(true, false)` (no kill credit), destroys/clears bomb + bonus pickups, calls `scoreSystem.clearUnbanked()`, respawns the player at `(arenaCenterX, arenaTop + 0.75 * arenaHeight)` (same as initial spawn), sets `invulnerableTimer = 2500`, nulls `resultData`, sets `state = PLAYING`, refreshes pause UI + affiliation HUD, restores gameplay music for the current phase, spawns fresh debris, then triggers `showLifeLostOverlay`.
  - New `showLifeLostOverlay(livesRemaining)`: 1.3s tween-in/out title text reading `LIFE LOST / N LIFE(S) REMAINING` in HAZARD color over BG stroke, depth 220.
  - `handleExtraction` tallies `addCampaignExtractedCredits(score)` on CAMPAIGN extracts; carries `campaignTotalExtracted` into `ResultData`.
  - `ResultData` interface gained `campaignTotalExtracted?: number`.
  - Result UI mode-summary line reads `CAMPAIGN OVER // SCORE SUBMITTED` instead of the old `FAVORS CLEARED`. The campaign progress line now shows `CAMPAIGN EXTRACTED: Nc // MISSIONS: N` (alpha bumped to 0.94 on game-over for prominence).
  - Result UI primary button: `NEW CAMPAIGN` on game over (starts fresh session, returns to MissionSelect), `NEXT RUN` on campaign extract (returns to MissionSelect, lives unchanged), `TAP TO RETRY` on arcade (direct restart). Removed the obsolete `NEXT LIFE` campaign-death label since soft respawn means we never reach the result screen mid-life.

### Design decisions
- **Soft respawn defers rep flux**: rep flux fires only when the *run* ends — extract or final death (game over). On a soft respawn, the run is still in progress, so we don't apply or surface flux deltas yet. The tracker keeps accumulating across lives; the final extract or game over flushes everything.
- **Salvage/mining accumulator across lives**: even though credits unbanked at death are lost, the accumulator that drives Reclaim/Deepcore rep keeps counting. Cleanest behaviorally (player who works hard gets credit), tilts slightly in player's favor. Alternative would be subtracting unbanked-at-death from the accumulator; flagged as a Known Issue for live tuning.
- **GameOver leaderboard score = `totalExtracted` at moment of game over**: campaign value to the leaderboard is the total credits extracted across the campaign, not the final run's banked score. We capture `totalExtractedBefore = campaignSession.totalExtracted` *before* consuming the life (since `consumeCampaignLife` clears the session on game over). No `mode` column yet — campaign + arcade rows are indistinguishable until Phase 7.
- **Spawn coordinates**: respawn uses the same coords the initial `Player` is constructed with in `create()` (`arenaCenterX`, `arenaTop + 0.75 * arenaHeight`). The arena top corner can shift with phase HUD/affiliation HUD layout but `getLayout()` already accounts for that.
- **Pickups cleared on respawn**: bomb + bonus pickups are destroyed on soft respawn so the player can't get a free instant kill from a leftover bomb. Salvage debris is regenerated via `spawnDebris()` so the new life starts with something to mine.
- **Music**: `setResultMusic` is skipped on the soft-respawn path so there's no jarring track change. `setGameplayMusicForPhase(currentPhase)` re-fires after the respawn to pick up where we left off.
- **`setSelectedMode` previously filtered CAMPAIGN to ARCADE** — that was a guard from before campaign was wired. Now removed; CAMPAIGN is a valid persisted mode.
- **MenuScene mode toggle is a single tap-target** rather than a paired button row. Reuses the existing `modeStatusText` real estate. Adding two pill buttons would have required reflowing the title block; the toggle is clear because the bottom hint line spells out the next mode.

### Verification
- `npm.cmd run build` → clean (TypeScript + Vite, 760ms). One intermediate failure was a missing `campaignTotalExtracted` on `ResultData` — added the field, second build green.
- No browser playtest yet. Top action in `state.md`.

### Notes for next session
- Phase 7: add `mode` column to Supabase `scores` table. Existing fallback pattern (`isMissingCompanyColumnError`) gives us the template — mirror that for `isMissingModeColumnError` and gracefully drop the field on legacy schemas. CampaignSubmit will need to pass `'CAMPAIGN'`, ARCADE submit `'ARCADE'`.
- Phase 8: `HowToPlayScene` — three short pages per the plan (MOVE / EXTRACT / REP). Add a `HOW TO PLAY` button on MenuScene near the affiliation/mode block.
- The campaign state now persists indefinitely once started. Players can leave the menu, return, and the campaign session is still there with lives intact. If the user wants a "FORFEIT CAMPAIGN" button on MissionSelect to abandon mid-session, that's an open question from the original plan.
- `DEFAULT_CAMPAIGN_LIVES = 2` lives in SaveSystem; trivial to bump if 2 feels light.
