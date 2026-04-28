# 2026-04-27 2038 Leaderboard Mode Column and HowToPlay

## TL;DR
- What changed: Phase 7 + Phase 8 of the plan landed in one pass. LeaderboardService gained a `LeaderboardMode = 'QUICK' | 'CAMPAIGN'` type, a `runModeToLeaderboardMode` mapper, and a progressive-fallback `insertScoreRow` helper that strips `mode` then `company_id` on missing-column errors. All submit callsites now pass a mode tag. New `HowToPlayScene` (3 pages: MOVE, EXTRACT, REP) is registered and wired to a top-left HOW TO PLAY button on MenuScene.
- Why: closing out the Affiliation Bonus + Campaign Lives plan's deferred phases. Phase 7 (leaderboard mode column) needs a server-side SQL migration as a separate manual step — the client-side fallback handles legacy schemas in the meantime. Phase 8 (How To Play) needed a one-shot scene; player-facing onboarding for movement, extraction, and the rep system.
- What didn't work: one TS strict warning — `howToPlayButton` field assigned but never read. Dropped the field; assignment is fire-and-forget. Build green on retry.
- Next: browser playtest both flows, then run the Supabase SQL migration (`ALTER TABLE scores ADD COLUMN IF NOT EXISTS mode TEXT;` + same for `losses`). Plan is complete.

---

## Full notes

### Phase 7 — Leaderboard mode column

#### Files changed
- `src/game/services/LeaderboardService.ts`:
  - New exported `LeaderboardMode` union and `runModeToLeaderboardMode(mode: RunMode): LeaderboardMode` helper.
  - `LeaderboardEntry` interface gained an optional `mode?: LeaderboardMode | null` field for future fetch consumers.
  - `submitScore` and `submitLoss` accept a `mode: LeaderboardMode = 'QUICK'` arg with a sensible default for un-tagged callers.
  - New private `insertScoreRow(table, playerName, score, companyId, mode)` does the actual insert + retry. Builds `{ player_name, score: floor(score), company_id, mode }`, inserts, then on error loops up to 2 times: if the error mentions `\bmode\b` strip `mode`, else if it mentions `company_id` strip `company_id`. If neither matches, break and warn. Order matters because Postgres returns one error at a time — Postgres typically complains about `mode` first since it's the last column listed, so two attempts are enough to handle the both-missing case.
  - New private `isMissingModeColumnError(message)` mirrors the existing company-id helper. Uses `\b` boundaries so it doesn't accidentally match other words containing "mode".
- `src/game/systems/BankingSystem.ts`: `finalizeExtraction` now imports `runModeToLeaderboardMode` and passes the tag on the ARCADE extract submit. The early-return for non-ARCADE modes stays, with a comment clarifying that campaign extracts intentionally don't submit per-run (campaign total submits once on game over).
- `src/game/scenes/GameScene.ts`:
  - Imports `runModeToLeaderboardMode` alongside the existing leaderboard helpers.
  - ARCADE death path: `submitLoss(playerName, lostScore, companyId, runModeToLeaderboardMode(this.runMode))` (always 'QUICK' here since ARCADE is the only branch that reaches it).
  - CAMPAIGN game-over path: `submitScore(playerName, totalExtractedBefore, companyId, runModeToLeaderboardMode(this.runMode))` ('CAMPAIGN').

#### Design decisions
- **`'QUICK'` not `'ARCADE'`**: plan terminology consistently uses "Quick Play" for the user-facing label of the single-run mode. Internal `RunMode.ARCADE` constant stays as is; the leaderboard tag uses 'QUICK' so server queries align with how the mode is named in product copy.
- **Progressive fallback** instead of a one-shot retry: the legacy schema may be missing `company_id`, `mode`, or both. A loop with two attempts handles all three cases without needing branching logic per call site.
- **`\b` boundary in mode regex**: avoids false positives like `"node_modules"` or other column names containing "mode" as a substring. The Postgres error format ("column \"mode\" of relation \"scores\" does not exist") works fine with the boundary.
- **Default `mode = 'QUICK'`**: keeps all existing callers compiling without forcing every call to pass the tag. New CAMPAIGN-aware sites pass it explicitly.
- **Fetch path unchanged**: leaderboard reads still don't request the `mode` column. Per the plan, "Filter UI later." When/if filter UI is added, fetch will request `mode` with the same fallback pattern.

### Phase 8 — How To Play screen

#### Files changed
- `src/game/constants.ts`: added `SCENE_KEYS.HOW_TO_PLAY = 'HowToPlayScene'`.
- `src/game/config.ts`: imports `HowToPlayScene` and registers it in the Phaser scene array.
- `src/game/scenes/HowToPlayScene.ts` (new):
  - Three `Page` objects with `title` + `body: string[]`. MOVE covers desktop pointer + touch drag steering, drift behavior, hazard list, shield mechanics. EXTRACT covers salvage → unbanked → bank-on-extract, lost-on-death, the 30s gate cycle, ARCADE-vs-CAMPAIGN difference. REP covers picking a corp at the menu, the four bonus types, mission-completion rep gain, Iron Veil rival cost, Free Port death penalty.
  - Local `createButton` helper builds graphics + label + zone in one shot for PREV/NEXT/BACK. Page dots render via `Graphics` clear + fillCircle on each `renderPage`, active dot uses `COLORS.GATE` + larger radius.
  - Keyboard nav: LEFT / RIGHT change page, ESC exits.
  - DONE label swaps in for NEXT on the last page; pressing it exits to MENU.
  - Uses `HologramOverlay` + `CustomCursor` for the same look as Menu / MissionSelect.
  - Cleanup destroys all per-page text, dots, buttons, hologram, cursor; removes keyboard listeners.
- `src/game/scenes/MenuScene.ts`:
  - New `createHowToPlayButton(uiDepth, backingTop, compactMenu, veryCompactMenu)` mirrors the existing top-right SETTINGS button at the top-left. Label is `HOW TO PLAY` on normal viewports, `GUIDE` on compact (fits the same 98/108 button width).
  - Called once from `create()` right before `createSettingsUi`.
  - Tap handler plays UI-select sfx, calls `cleanupBackground` (so the background sim entities are released cleanly), then `scene.start(SCENE_KEYS.HOW_TO_PLAY)`.

#### Design decisions
- **One-shot scene** rather than a modal overlay on MenuScene: gives full screen real estate, simpler keyboard handling, and reuses the existing scene-start pattern. Cost is one extra scene file; benefit is less coupling to MenuScene's settings panel logic.
- **Three short pages, terse copy**: matches the plan's "Three short pages" requirement. No images yet — pure text. If the team wants illustrated controls later, the page model accepts a body of arbitrary lines.
- **Color treatment**: title in `COLORS.HUD`, page subtitle in `COLORS.GATE`, body lines in `COLORS.SALVAGE`. Empty body lines render with alpha 0 to act as spacers without measuring height differently.
- **Compact label fallback (`GUIDE`)**: 11 characters of `HOW TO PLAY` got tight on `compactMenu`, so the compact path uses the shorter label rather than ballooning the button width.
- **`howToPlayButton` not stored as a field**: was caught by `noUnusedLocals` because nothing reads it after creation. Made it a fire-and-forget call. If we need to update the label dynamically (e.g. on layout-resize), turn it back into a field and call `setText` from the resize handler.

### Verification
- `npm.cmd run build` → clean (TypeScript + Vite, 782ms). One intermediate failure on the unused field, fixed.
- No browser playtest. Top action in `state.md`.

### Notes for next session
- **Manual SQL migration on Supabase** is the one outstanding task. Run on both `scores` and `losses`:
  ```sql
  ALTER TABLE scores ADD COLUMN IF NOT EXISTS mode TEXT;
  ALTER TABLE losses ADD COLUMN IF NOT EXISTS mode TEXT;
  ```
  Until run, the client-side fallback strips `mode` and writes the row without it. Existing rows stay null.
- Plan is now complete (all 6 phases shipped). Next session's spec is open. Likely candidates: leaderboard filter UI for QUICK vs CAMPAIGN, polish on the LIFE LOST overlay timing, beam audio replacement, the `PHASE_LENGTH` measurement, or the Tauri packaging restart.
- The HowToPlayScene's `cleanupBackground` call from the menu tap handler exists in MenuScene already; verify it's safe to call before `scene.start` on this path. (It is — same pattern as DEPLOY.)
