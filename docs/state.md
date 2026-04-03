# State
_Last updated: 2026-04-03 0006_

## Current focus
Session wrapped after packaging the current gameplay, UI, mission, and audio pass for git commit and push.

## What's working
- Menu, MissionSelect, gameplay, pause, death, and extract all use the current layered music flow with the provided stems
- Gameplay and UI SFX are wired through the shared `FX VOL` path, including the newer NPC death, board-wipe, and phase-5 warning triggers
- MissionSelect, HUD, comm, cursor, layout, and gameplay polish changes from the current worktree are all staged as one integrated pass
- `npm.cmd run build` passes on the current worktree

## In progress
- The remaining follow-up work is mostly feel and backend cleanup rather than blocked implementation

## Known issues
- Browser autoplay restrictions still require an initial player interaction before audio can become audible on some fresh browser sessions
- The soundtrack and SFX still need a real feel pass for balance, overlap, and loudness
- `Bomb - Copy.mp3` was provided but left unused because it appears to duplicate `Bomb.mp3`
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` still needs a nullable `company_id` column added server-side before new submissions can persist company affiliation

## Next actions
1. Playcheck the current audio mix and trigger timing on device
2. Run the server-side `company_id` migration for the `scores` table
3. Continue the next gameplay polish pass from the current main branch state

## Active plan
docs/plans/2026-04-02 2354 Plan revision - Layered Music System.md

## How to verify
1. Run `npm.cmd run build`
2. Confirm Menu to MissionSelect to gameplay still follows the current music progression
3. Confirm NPC deaths, the opening board wipe, and the phase-5 warning all fire their intended SFX
4. Confirm recent UI and mission-flow changes still behave correctly on desktop and mobile

## Recent logs
- docs/log/2026-04-03 0006 Git Push Wrap-Up.md - closed the current worktree into a single ship-ready git pass
- docs/log/2026-04-03 0001 Gameplay Audio Trigger Timing Pass.md - added NPC death cues, gave the opening board wipe the bomb sound, and moved the first enemy warning to the phase 5 transition
- docs/log/2026-04-02 2357 Mission Select Unlock Music Fix.md - moved pending music unlock handling to Phaser's sound-manager unlock event so the first briefing visit keeps its bass handoff
