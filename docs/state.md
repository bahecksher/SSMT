# State
_Last updated: 2026-04-29 2119_

## Current focus
Session wrap. Menu chrome unified across Menu, MissionSelect, VersusLobby, HowToPlay via shared `src/game/ui/menuLayout.ts`. Pause-menu palette swap and music `*BETA*` tags removed. Corp leaderboard now shows all 4 corps with full names, smaller donut on compact viewports, and a recolored donut globe matching the background `GeoSphere`. Stray divider line cutting through CAMPAIGN high score hidden in non-arcade modes. Arcade pilot board cap raised so phone shows more than just #1. Pushed as `7f2bea4` on `origin/main`.

## What's working
- `src/game/ui/menuLayout.ts`: shared top-nav metrics (`getTopNavMetrics`) + bottom-action metrics (`getPrimaryActionMetrics`).
- `src/game/ui/CorporationScoreGraph.ts`: donut globe uses `COLORS.NPC` (matches background GeoSphere body).
- `src/game/scenes/MenuScene.ts`:
  - HOW TO PLAY (left, full label always) + SETTINGS (right) read from shared helper.
  - TAP TO START y matches shared bottom anchor.
  - Arcade pilot leaderboard: tighter font (11/14) + rowHeight (18/24), row cap raised to 10.
  - Corp leaderboard: all four corps via `buildFullCorpEntries`; full company names; tighter font (11/14) + rowHeight (18/24); donut radius clamps `28-42` compact / `48-70` desktop; donut sits flush under divider; row gap below donut `6/10`.
  - Leaderboard divider hides in CAMPAIGN / VERSUS via `leaderboardSectionUi`.
  - Music `*BETA*` removed.
- `src/game/scenes/MissionSelectScene.ts`: MENU + SETTINGS shared metrics; DEPLOY shares bottom anchor; music `*BETA*` removed.
- `src/game/scenes/VersusLobbyScene.ts`: BACK button shared metrics.
- `src/game/scenes/HowToPlayScene.ts`: BACK button shared metrics.
- `src/game/scenes/GameScene.ts`: pause palette swap removed; music `*BETA*` removed; orphaned `applyActivePalette` / `refreshCountdownPalette` deleted; constrained live versus still skips peer enemy ghost rendering and live mirror tint fill.
- `src/game/data/renderTuning.ts`: constrained-vs-default render profile.
- `src/game/entities/{GeoSphere,DrifterHazard,SalvageDebris}.ts`: lighter detail on constrained phone-sized viewports.
- Existing versus flow remains intact.
- `npm.cmd run build`: passes.
- `git status`: clean. `main` at `7f2bea4`, synced with `origin/main`.

## In progress
- Nothing in flight — session wrapped.

## Known issues
- VersusLobbyScene has no SETTINGS panel; only BACK occupies the top row.
- TutorialArenaScene BACK still sits top-right, not aligned to the shared top-left corner pattern.
- Title hero sizing still varies by design between Menu, MissionSelect, VersusLobby.
- Versus mirror framerate fix is build-verified only; no fresh phone verification.
- Versus flow missing fresh two-window manual playtest after the cumulative chrome / pause-menu / corp-board / pilot-board changes.
- Spectate lane buttons still sit on arena edges and may crowd ships or hazards.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Restored arcade/campaign company buffs not manually verified.
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.
- Earlier in this session a log file was edited after creation rather than spawned as a separate log; minor AGENTS.md append-only nit.

## Next actions
1. Live iPhone 13 mini pass:
   - Top-left HOW TO PLAY label fits without overflow.
   - Corp board: full names, smaller donut, donut globe matches background, no Slick comm overlap.
   - Campaign view: no divider line through high score.
   - Arcade pilot board: ≥6-8 rows visible.
   - Pause menu: SHAKE / SCAN / MUSIC stack tight, no PALETTE row, no `*BETA*`.
2. Two-window versus pass to confirm cumulative changes did not regress lobby -> deploy -> spectate -> result -> rematch loop.
3. Decide whether to unify TutorialArena BACK and add a SETTINGS panel mirror to VersusLobby.

## Active plan
docs/plans/2026-04-29 1930 Plan - Unified Top Nav Layout.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`, open at iPhone 13 mini-sized viewport (~375x812).
3. Walk through Menu, MissionSelect, VersusLobby, HowToPlay. Confirm corner buttons mirror placement + size + font; HOW TO PLAY label is full; TAP TO START / DEPLOY share the same bottom y.
4. Menu → ARCADE → PILOTS: confirm more than #1 renders. Switch to CORPS: full names, smaller donut, matching globe color. Switch to CAMPAIGN: no stray divider line.
5. Start a run, hit pause: SHAKE / SCAN / MUSIC, no PALETTE, no `*BETA*`.
6. Two-window versus and confirm flow still works.

## Recent logs
- docs/log/2026-04-29 2119 Session Wrap Menu Polish.md - session wrap covering top-nav unification, pause palette removal, corp/pilot board polish, and push.
- docs/log/2026-04-29 2110 Arcade Pilot Board More Rows.md - tighter font + rowHeight + cap raised to 10 so the arcade pilot board shows more than just the leader.
- docs/log/2026-04-29 2107 Corp Board Full Names and Globe Recolor.md - full corp names, smaller donut on compact, donut globe color matches background.
- docs/log/2026-04-29 2101 Corp Board Tightening and Campaign Divider Hide.md - tightened corp row spacing + donut top gap, hid leaderboard divider in non-arcade modes, kept HOW TO PLAY full label.
- docs/log/2026-04-29 2027 Pause Palette Removed and Corp Board Full Roster.md - dropped pause-menu palette swap + music `*BETA*` tags; corp leaderboard now always shows all four corps.
- docs/log/2026-04-29 1948 Unified Top Nav Layout.md - shared corner-button + bottom-action metrics across Menu, MissionSelect, VersusLobby, and HowToPlay.
