# State
_Last updated: 2026-04-07 0209_

## Current focus
Mobile readability and spacing cleanup for narrow / short phone screens (iPhone 13 mini class), with HUD abbreviations and settings panel spacing pass.

## What's working
- Menu, Mission Select, save data, and results support distinct `CAMPAIGN` and `ARCADE` modes with separate wallets and campaign life / favor carryover
- Deepcore's secondary mission now uses `BREAK ASTEROIDS`, and campaign sessions track completed mission count across runs
- HUD now abbreviates labels on narrow (<=390px) screens: `CR:` instead of `CREDITS:`, `LV` instead of `// LIVES`, `M` instead of `// MISS`, with smaller font (11px) and tighter element gaps (6px)
- Menu and MissionSelect settings panels now use proportional row spacing that compresses on veryCompact screens instead of fixed pixel offsets
- Mission Select compacts mission cards, wallet copy, favor badges, and favor-card text aggressively on cramped phone screens (ultraDense favor layout)
- Compact comm panels reduce typography and padding, and the top HUD drops `BEST` to a second row when the first row gets crowded
- Result overlays use ultraCompactResults with shorter labels (`BANKED` / `LOST`) and tighter gaps on small screens
- Pause menu debug phase section uses tighter spacing on densePause screens (34px gap instead of 44px for phase buttons)
- Phase 10 gunship boss, palette rotation, white shield lane, and favor-tier pricing/copy updates remain in place
- `npm.cmd run build` passes

## In progress
- On-device validation of all screens on iPhone 13 mini Safari viewport (~375x635)
- Live tuning for phase 10 stagger spacing, beam safe-window length, shield pacing, debris density, and final hostile/player color balance

## Known issues
- Local `BEST` score is still shared across campaign and arcade even though leaderboard submission is arcade-only
- Background simulation remains duplicated between MenuScene and MissionSelectScene
- Settings UI remains duplicated across MenuScene, MissionSelectScene, and GameScene pause menu
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Soundtrack and SFX still need a real feel pass for balance, overlap, and loudness
- Retry/continue after extraction still bypasses MissionSelect for a direct next run
- Beam hazards still span full screen width/height, not clipped to arena
- Boss encounter balance is not tuned yet for all screen sizes or for long post-kill survival windows
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Supabase `scores` still needs a nullable `company_id` column added server-side

## Next actions
1. Smoke test Menu, Mission Select, pause, and result screens on an iPhone 13 mini or equivalent `375x635` viewport and note any remaining collisions
2. Run a gameplay session and confirm the abbreviated HUD labels (CR: / LV / M) stay readable once scores and mission counts grow
3. Resume gameplay tuning and campaign/favor validation after the mobile layout pass is confirmed on-device

## Active plan
docs/plans/2026-04-07 0148 Plan - Mobile Screen Cleanup.md

## How to verify
1. Run `npm.cmd run build`
2. Open the game in a narrow / short mobile viewport around `375x635`
3. On Menu, confirm leaderboard rows stop before the Slick comm panel and `TAP TO START`
4. On Mission Select, confirm mission cards, wallet text, and all four favor cards stay readable without text collisions
5. In a campaign run, confirm the top HUD shows `CR: {n} LV {n} M{n}` without overflow on narrow screens
6. Pause and finish a run, then confirm the pause and result overlays remain readable without stacked sections overlapping
7. Open Settings on MissionSelect and confirm all rows (palette, shake, scan, music, volume sliders) fit within the panel

## Recent logs
- docs/log/2026-04-07 0209 HUD and Settings Panel Mobile Pass.md - abbreviated HUD labels for narrow screens, tightened settings panel and pause menu spacing
- docs/log/2026-04-07 0148 Mobile Screen Cleanup.md - tightened narrow/short phone layouts across menu, mission select, HUD, pause, and results
- docs/log/2026-04-07 0132 Campaign Mission Completion Tracking.md - added persistent campaign mission completion tracking
