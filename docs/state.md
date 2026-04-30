# State
_Last updated: 2026-04-29 2110_

## Current focus
Corp leaderboard polish: full corp names always shown, donut chart shrinks on constrained viewports so all four rows fit, donut globe color matches the background `GeoSphere` (NPC color, not HAZARD). Top-nav unification and pause-menu palette cleanup from earlier in the session still in place.

## What's working
- `src/game/ui/menuLayout.ts`: shared corner-button metrics + bottom-action y/font.
- `src/game/ui/CorporationScoreGraph.ts`: donut globe now uses `COLORS.NPC` (matches background GeoSphere body).
- `src/game/scenes/MenuScene.ts`:
  - HOW TO PLAY (left, full label always) + SETTINGS (right) read from the shared helper.
  - TAP TO START y matches shared bottom anchor.
  - Arcade pilot leaderboard now uses dedicated tighter font + rowHeight (font 11/14, row 18/24) and a row cap of 10, so up to the full API top-10 fits instead of just the leader.
  - Corp leaderboard renders all four corps via `buildFullCorpEntries`, full company names (no more `leaderboardTag` collapse), dedicated tighter font + rowHeight, smaller donut on constrained viewports.
  - Leaderboard divider hides in CAMPAIGN / VERSUS modes.
  - Music `*BETA*` removed.
- `src/game/scenes/MissionSelectScene.ts`: MENU + SETTINGS shared metrics; DEPLOY shares bottom anchor; music `*BETA*` removed.
- `src/game/scenes/VersusLobbyScene.ts`: BACK button shared metrics.
- `src/game/scenes/HowToPlayScene.ts`: BACK button shared metrics.
- `src/game/scenes/GameScene.ts`: pause palette swap + music `*BETA*` removed; constrained live versus skips peer enemy ghost rendering and live mirror tint fill.
- `src/game/data/renderTuning.ts`: constrained-vs-default render profile.
- `src/game/entities/GeoSphere.ts`, `DrifterHazard.ts`, `SalvageDebris.ts`: lighter detail on constrained phone-sized viewports.
- Existing versus flow remains intact.
- `npm.cmd run build`: passes.

## In progress
- Live iPhone 13 mini playcheck of corp leaderboard (smaller donut, full names, matching globe color), campaign leaderboard, and HOW TO PLAY full label.
- Two-window versus pass after the cumulative chrome / pause-menu / corp-board changes.

## Known issues
- VersusLobbyScene has no SETTINGS panel; only BACK occupies the top row.
- TutorialArenaScene BACK still sits top-right, not aligned to the shared top-left corner pattern.
- Title hero sizing still varies by design between Menu, MissionSelect, VersusLobby.
- Versus mirror framerate fix is build-verified only; no fresh phone verification.
- Versus flow missing fresh two-window manual playtest.
- Spectate lane buttons still sit on arena edges and may crowd ships or hazards.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Restored arcade/campaign company buffs not manually verified.
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.
- Earlier in this session a log file was edited after creation rather than spawned as a separate log; minor AGENTS.md append-only nit.

## Next actions
1. Live iPhone 13 mini pass: corp leaderboard reads with all four full names + smaller donut + matching globe color. Confirm Slick comm fits cleanly below.
2. Two-window versus pass to confirm cumulative changes did not regress lobby -> deploy -> spectate -> result -> rematch loop.
3. Decide whether to unify TutorialArena BACK and add a SETTINGS panel mirror to VersusLobby.

## Active plan
docs/plans/2026-04-29 1930 Plan - Unified Top Nav Layout.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`, open at iPhone 13 mini-sized viewport (~375x812).
3. Menu: top-left button reads "HOW TO PLAY". Switch to ARCADE → CORPS: donut is smaller than before, globe inside donut shares the background GeoSphere color, four full corp names render under the donut.
4. Switch to CAMPAIGN: no horizontal divider line cuts through the LOCAL HIGH SCORE row.
5. Start a run, hit pause: SHAKE / SCAN / MUSIC stack tight, no PALETTE row, no `*BETA*`.
6. Open settings panels in main menu and mission select: music row clean.
7. Open two browser windows for versus and confirm flow still works.

## Recent logs
- docs/log/2026-04-29 2110 Arcade Pilot Board More Rows.md - tighter font + rowHeight + cap raised to 10 so the arcade pilot board shows more than just the leader.
- docs/log/2026-04-29 2107 Corp Board Full Names and Globe Recolor.md - full corp names, smaller donut on compact, donut globe color matches background.
- docs/log/2026-04-29 2101 Corp Board Tightening and Campaign Divider Hide.md - tightened corp row spacing + donut top gap, hid leaderboard divider in non-arcade modes, kept HOW TO PLAY full label.
- docs/log/2026-04-29 2027 Pause Palette Removed and Corp Board Full Roster.md - dropped pause-menu palette swap + music `*BETA*` tags; corp leaderboard now always shows all four corps.
- docs/log/2026-04-29 1948 Unified Top Nav Layout.md - shared corner-button + bottom-action metrics across Menu, MissionSelect, VersusLobby, and HowToPlay.
