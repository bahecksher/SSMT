# State
_Last updated: 2026-04-09 1438_

## Current focus
Startup presentation during cold browser loads, including boot-loader typography, meaningful progress timing, a softer CRT close-and-open handoff, and title-font fidelity on the main menu.

## What's working
- Boot now shows a live startup loading screen with starfield, rotating globe/ring, scanline overlay, `Securing Connection` in the pixel_lcd title font, a larger single-line Slick intro, a loading bar that fills smoothly over the full boot duration, and a minimum ~4 second display before the menu can open
- Boot text appears only after fonts load — no fallback-font pop-in
- The boot flow now launches `MenuScene` through a two-step CRT-style handoff that closes inward to a narrow center slit and then opens back out, using translucent HUD-tinted shutters and flash instead of a harsh white wipe
- Menu title text is explicitly refreshed after the title font loads so `SLICK'S`, `SALVAGE & MINING`, and `REMOTE PILOT INTERFACE` keep the intended title-font styling
- Countdown text uses pixel_lcd without bold and with reduced stroke for a sharper, less fuzzy appearance
- Menu, Mission Select, save data, and results support distinct `CAMPAIGN` and `ARCADE` modes with separate wallets and campaign life / favor carryover
- Deepcore's secondary mission now uses `BREAK ASTEROIDS`, and campaign sessions track completed mission count across runs
- Narrow-screen HUD, settings, Mission Select, pause, and results all have the recent compact-phone spacing pass in place
- Asteroid mining rings are yellow, enemy ships use visible hull fill, countdown text stays on one line without glow/zoom, and the globe ring is intentionally subtle
- `npm.cmd run build` passes

## In progress
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
1. Resume the pending mobile viewport validation after the startup flow is confirmed
2. Live tuning pass for phase 10 stagger spacing, beam safe-window length, shield pacing
3. Soundtrack and SFX balance pass

## Active plan
docs/plans/2026-04-09 0116 Plan revision - Startup Loading Screen.md

## How to verify
1. Run `npm.cmd run build`
2. Open the game from a cold browser load or hard refresh
3. Confirm startup shows the starfield, rotating globe/ring, `Securing Connection` in the pixel_lcd font (no fallback pop), a larger Slick intro line, and a smoothly filling loading bar
4. Confirm the loading bar fills steadily from 0% to 100% over the full boot duration (not stuck then jumping)
5. Confirm the menu reveal briefly closes inward to a center slit and then opens back out using a soft HUD-tinted CRT treatment
6. Confirm the `SLICK'S` title block on the menu is rendered in the title font
7. Start a mission and confirm the countdown text (STAY ALIVE / GET OUT / GET PAID / GO) is sharp, not fuzzy or bolded

## Recent logs
- docs/log/2026-04-09 1438 Boot Screen Polish.md — smooth loading bar, pixel_lcd font fix, countdown de-fuzz
- docs/log/2026-04-09 1250 Codex Config Defaults.md — updated the Codex home config defaults to use the dangerous profile with high reasoning and web search enabled; no repo source files changed
- docs/log/2026-04-09 0116 Boot Loader CRT Close and Open Transition.md — replaced the outward-only white reveal with a softer HUD-tinted close-in then open CRT handoff
