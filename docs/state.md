# State
_Last updated: 2026-04-09 0116_

## Current focus
Startup presentation during cold browser loads, including boot-loader typography, meaningful progress timing, a softer CRT close-and-open handoff, and title-font fidelity on the main menu.

## What's working
- Boot now shows a live startup loading screen with starfield, rotating globe/ring, scanline overlay, the single-line status `Securing Connecting` in the alternate UI font, a larger single-line Slick intro, a loading bar that keeps progressing until handoff, and a minimum ~4 second display before the menu can open
- The boot flow now launches `MenuScene` through a two-step CRT-style handoff that closes inward to a narrow center slit and then opens back out, using translucent HUD-tinted shutters and flash instead of a harsh white wipe
- Menu title text is explicitly refreshed after the title font loads so `SLICK'S`, `SALVAGE & MINING`, and `REMOTE PILOT INTERFACE` keep the intended title-font styling
- Menu, Mission Select, save data, and results support distinct `CAMPAIGN` and `ARCADE` modes with separate wallets and campaign life / favor carryover
- Deepcore's secondary mission now uses `BREAK ASTEROIDS`, and campaign sessions track completed mission count across runs
- Narrow-screen HUD, settings, Mission Select, pause, and results all have the recent compact-phone spacing pass in place
- Asteroid mining rings are yellow, enemy ships use visible hull fill, countdown text stays on one line without glow/zoom, and the globe ring is intentionally subtle
- `npm.cmd run build` passes

## In progress
- Hard-refresh / cold-cache browser validation of the startup loading screen copy, menu-title font appearance, progress feel, and the new close-then-open CRT transition timing
- On-device validation of Menu, Mission Select, HUD, pause, and results around the iPhone 13 mini `375x635` class viewport
- Live tuning for phase 10 stagger spacing, beam safe-window length, shield pacing, debris density, and hostile/player color balance

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
1. Hard-refresh the game in a browser and confirm the CRT transition briefly closes inward and then opens back out before the menu becomes interactive
2. Confirm the HUD-tinted transition feels softer than the earlier white pass while still reading clearly on cold load
3. Resume the pending mobile viewport validation after the startup flow is confirmed

## Active plan
docs/plans/2026-04-09 0116 Plan revision - Startup Loading Screen.md

## How to verify
1. Run `npm.cmd run build`
2. Open the game from a cold browser load or hard refresh
3. Confirm startup shows the starfield, rotating globe/ring, `Securing Connecting` in the alternate font, a larger single-line Slick intro, and the loading bar before the menu appears
4. Confirm the loading bar does not look finished early and only reaches full as the menu handoff occurs
5. Confirm the menu reveal briefly closes inward to a center slit and then opens back out using a soft HUD-tinted CRT treatment
6. Confirm the `SLICK'S` title block on the menu is rendered in the title font

## Recent logs
- docs/log/2026-04-09 0116 Boot Loader CRT Close and Open Transition.md - replaced the outward-only white reveal with a softer HUD-tinted close-in then open CRT handoff
- docs/log/2026-04-09 0109 Boot Loader CRT Transparency Tuning.md - softened the outward white CRT reveal by making the shutters, line glow, and flash semi-transparent
- docs/log/2026-04-09 0107 Boot Loader Transition Direction and Menu Title Font.md - flipped the CRT handoff outward, made it white, and refreshed the menu title after the title font loads
- docs/log/2026-04-09 0101 Boot Loader Status Font Swap.md - changed the boot status line to the alternate font and cleaned up the unused title-font import
