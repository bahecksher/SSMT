# State
_Last updated: 2026-04-03 0030_

## Current focus
Published the current gameplay stability and MissionSelect economy pass after verifying the bomb pickup fix and the cheaper two-favor setup.

## What's working
- Menu, MissionSelect, gameplay, pause, death, and extraction still use the current layered music flow with the provided stems
- Gameplay and UI SFX are wired through the shared `FX VOL` path, including the newer NPC death, board-wipe, and phase-5 warning triggers
- Player-collected bomb wipes now exit the frame immediately after `boardWipe(true)`, preventing post-wipe update work and multi-bomb loop glitches
- MissionSelect now prices every favor at `2000c` and blocks a third selection once two favors are armed, showing `MAX 2` on the remaining cards
- `npm.cmd run build` passes on the current worktree

## In progress
- The remaining follow-up work is still mostly feel, playcheck, and backend cleanup rather than blocked implementation

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
1. Playcheck the new two-favor, `2000c` economy on device and confirm the `MAX 2` state reads clearly
2. Playtest bomb pickup wipes with multiple bombs active to confirm the field stays stable through the flash
3. Run the server-side `company_id` migration for the `scores` table

## Active plan
docs/plans/2026-04-02 2354 Plan revision - Layered Music System.md

## How to verify
1. Run `npm.cmd run build`
2. Open MissionSelect and confirm each favor card shows `2000c`
3. Arm any two favors and confirm the remaining unselected cards show `MAX 2` and cannot be selected until one is removed
4. Start a run, confirm purchased boosts still apply, then collect a bomb and verify the board wipes cleanly without a runtime glitch

## Recent logs
- docs/log/2026-04-03 0030 Git Push.md - committed and pushed the current bomb-fix and favor-economy pass on main
- docs/log/2026-04-03 0027 Favor Economy Trim.md - lowered favor cost to `2000c` and capped armed favors at two
- docs/log/2026-04-03 0020 Bomb Pickup Glitch Fix.md - stopped bomb collection from continuing the same frame after a board wipe
