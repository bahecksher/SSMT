# State
_Last updated: 2026-04-13 2341_

## Current focus
Startup load performance during cold browser loads, specifically removing boot-time blockers while preserving the current loader presentation and early gameplay audio behavior.

## What's working
- Boot still shows the live startup loader with the starfield, globe/ring, scanline treatment, font-gated title text, and the softer CRT close-and-open menu handoff
- Boot now preloads only the menu and earliest gameplay music layers instead of the full soundtrack stack, which removes the largest startup bottleneck
- Boot minimum display time is now about `1.5s` instead of `4s`, so the menu can appear much sooner once critical assets are ready
- Menu, Mission Select, and Game now warm later music in the background, and the big full-phase tracks are deferred until the run is near their phase threshold
- Countdown text, campaign/arcade split, recent compact-phone spacing work, and the Deepcore `BREAK ASTEROIDS` mission change remain intact
- `npm.cmd run build` passes

## In progress
- Cold-refresh validation in a real browser to confirm the startup feels materially faster on-device
- Long-run validation to confirm phase 3+ layered music and late full-track handoffs arrive cleanly after the new lazy-load changes
- On-device validation of Menu, Mission Select, HUD, pause, and results around the iPhone 13 mini `375x635` class viewport

## Known issues
- Local `BEST` score is still shared across campaign and arcade even though leaderboard submission is arcade-only
- Background simulation remains duplicated between MenuScene and MissionSelectScene
- Settings UI remains duplicated across MenuScene, MissionSelectScene, and GameScene pause menu
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Late-game music assets are still very large `.wav` files, so phase 5+ audio would benefit from asset compression in addition to the new lazy-loading
- Retry/continue after extraction still bypasses MissionSelect for a direct next run
- Beam hazards still span full screen width/height, not clipped to arena
- Boss encounter balance is not tuned yet for all screen sizes or for long post-kill survival windows
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Supabase `scores` still needs a nullable `company_id` column added server-side

## Next actions
1. Cold-refresh the game and confirm the boot reaches the menu noticeably faster without visual regressions
2. Run into phase 3+ and late-game thresholds to verify the new music warm-up path does not create awkward dead air
3. Consider recompressing the remaining large late-game music `.wav` assets if startup or in-run audio fetches still feel heavy

## Active plan
docs/plans/2026-04-13 2341 Plan revision - Startup Loading Performance.md

## How to verify
1. Run `npm.cmd run build`
2. Open the game from a cold browser load or hard refresh
3. Confirm the boot still shows the starfield, globe/ring, `Securing Connection`, and the current CRT handoff styling
4. Confirm the menu appears after about `1.5s` once the essential assets are ready instead of waiting for the old ~4 second floor
5. Start a run and confirm menu/early gameplay music is available without waiting for the full soundtrack stack to finish downloading
6. Play into later phases and confirm phase 3+ music and late full-track transitions enter once their deferred loads complete

## Recent logs
- docs/log/2026-04-13 2341 Startup Load Optimization.md — cut boot-time music preload, shortened the boot hold, and deferred later soundtrack loading
- docs/log/2026-04-09 1438 Boot Screen Polish.md — smooth loading bar, pixel_lcd font fix, countdown de-fuzz
