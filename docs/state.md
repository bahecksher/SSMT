# State
_Last updated: 2026-04-13 2352_

## Current focus
Startup load performance and shipped audio footprint, with the current emphasis on validating that compressed browser-ready music assets preserve clean looping and smooth late-phase handoffs.

## What's working
- Boot still keeps the starfield loader, font-gated title treatment, and softer CRT menu handoff
- Boot still avoids front-loading the full soundtrack and now also serves the music tracks as compressed `ogg` plus `mp3` fallback assets instead of large WAVs
- The active music asset set used by the game dropped from about `175.42 MB` of WAVs to about `31.35 MB` of compressed assets
- Menu, Mission Select, and Game still warm later music in the background, and the late full-phase tracks remain deferred until the run is close to needing them
- Countdown text, campaign/arcade split, recent compact-phone spacing work, and the Deepcore `BREAK ASTEROIDS` mission change remain intact
- `npm.cmd run build` passes

## In progress
- Cold-refresh validation in a real browser to confirm startup feels faster with the compressed music set in place
- Long-run validation to confirm compressed loops stay clean through phase 3+ layering and phase 5+ full-track handoffs
- On-device validation of Menu, Mission Select, HUD, pause, and results around the iPhone 13 mini `375x635` class viewport

## Known issues
- Local `BEST` score is still shared across campaign and arcade even though leaderboard submission is arcade-only
- Background simulation remains duplicated between MenuScene and MissionSelectScene
- Settings UI remains duplicated across MenuScene, MissionSelectScene, and GameScene pause menu
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Compressed music quality and loop seams still need subjective browser/device verification after the transcode
- Retry/continue after extraction still bypasses MissionSelect for a direct next run
- Beam hazards still span full screen width/height, not clipped to arena
- Boss encounter balance is not tuned yet for all screen sizes or for long post-kill survival windows
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Supabase `scores` still needs a nullable `company_id` column added server-side

## Next actions
1. Cold-refresh the game and confirm the boot reaches the menu quickly with no loader or audio regressions
2. Play into phase 3+ and phase 5+ to verify the compressed music still layers and loops cleanly
3. Tune compression settings further only if audible artifacts or loop seams show up in browser testing

## Active plan
docs/plans/2026-04-13 2352 Plan revision - Startup Loading Performance.md

## How to verify
1. Run `npm.cmd run build`
2. Open the game from a cold browser load or hard refresh
3. Confirm the boot still shows the current starfield, globe/ring, `Securing Connection`, and CRT handoff styling
4. Confirm the menu appears after the shorter boot delay and no longer depends on shipping large WAV files
5. Start a run and confirm music plays with the new compressed assets in Menu, Mission Select, and early gameplay
6. Play into later phases and confirm the phase 3+ layers and phase 5+ full-track loops still transition cleanly

## Recent logs
- docs/log/2026-04-13 2352 Audio Compression.md — replaced the shipped WAV music with compressed ogg/mp3 variants and cut the active music payload by about 144 MB
- docs/log/2026-04-13 2341 Startup Load Optimization.md — cut boot-time music preload, shortened the boot hold, and deferred later soundtrack loading
