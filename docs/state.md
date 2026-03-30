# State
_Last updated: 2026-03-29 2228_

## Current focus
Session wrapped after merging Blake's MissionSelect readability PR `#3` onto `main` and re-verifying the build.

## What's working
- Runtime scene flow remains `Menu -> MissionSelect -> Game`, with layered music and shared settings still intact across all scenes
- MissionSelect has its own settings modal with shake, scanline, music, music-volume, and FX-volume controls
- Favor cards now render as a single full-width vertical stack without changing the deploy flow
- Favor cards now use company-colored core text and progress fills, red `SHORT` / `LOCKED` state text, and mission-matched inactive borders
- Favor-card typography and spacing were tuned for readability without changing card size, including clearing the bottom detail line from the progress bar
- Mission cards keep company-colored text for clearer faction identity
- Reclaim now uses the in-game purple/magenta palette instead of green
- Mining floating credit popups now use the orange mining color instead of red
- Blake's PR `#3` is now merged onto local `main`
- `npm.cmd run build` passes
- `npm.cmd run dev` still starts successfully with Vite's native config loader

## In progress
Nothing active.

## Known issues
- Browser autoplay restrictions may delay the first audible music start until player interaction after opting in
- Stem balance and fade timing still need a real feel pass with the current mix
- Vite may skip to a higher port if 5173 is already occupied
- The stacked MissionSelect favor layout still needs a real short-phone check for tap comfort and text density, especially with locked and unaffordable states
- Favor costs and paid-reroll pricing still need balance playtesting together
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No SFX or voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` table must be created manually (see leaderboard plan)

## Next actions
1. Playcheck the stacked MissionSelect favor list on a short phone viewport and tune text density if needed
2. Confirm the mining popup color and favor-card spacing feel right on-device
3. Continue the adaptive music feel pass, especially stem balance and volume behavior

## Active plan
docs/plans/2026-03-29 1753 Plan - Layered Music System.md

## How to verify
1. Run `npm.cmd run build`
2. Open MissionSelect and confirm the favor section is a single stacked list with readable spacing, mission-matched inactive borders, and company-colored inner content
3. Confirm `RECLAIM CO // VOSS` now uses the purple/magenta palette instead of green
4. Confirm the favor-card bottom detail line no longer overlaps the progress bar
5. Start gameplay, mine an asteroid, and confirm the floating `+` credit text now uses the orange mining color instead of red

## Recent logs
- docs/log/2026-03-29 2228 Merge Blake PR 3.md - fetched PR `#3`, fast-forwarded `main`, and re-verified the build before push
- docs/log/2026-03-29 1950 MissionSelect UI Session Rollup.md - consolidated the MissionSelect styling, readability, and mining-popup color work from this session into one summary
- docs/log/2026-03-29 1838 Session Wrap and Push.md - wrapped the adaptive music/settings work into a final session snapshot before pushing
