# State
_Last updated: 2026-03-29 1838_

## Current focus
Session wrapped after landing the first adaptive music/settings pass on top of the latest cursor improvements already on `main`.

## What's working
- Custom cursor runs on desktop in `Menu`, `MissionSelect`, and `Game`, including the newer morph-to-button behavior for interactive controls
- Runtime scene flow is still `Menu -> MissionSelect -> Game`, now with scene-based music handoff
- Boot preloads the three `Phase Lock` stems and the shared music manager keeps them in sync across scene changes
- Menu targets synth only, MissionSelect targets drums only, and gameplay escalates to drums + bass at phase 4 then full mix at phase 6
- Music stays wired through the shared system and now defaults to off for fresh installs and older saved settings via a one-time migration
- Music can be toggled from Menu, MissionSelect, and the in-run pause menu, and all surfaces keep the `*BETA*` marker
- MissionSelect has its own settings modal with shake, scanline, music, music-volume, and FX-volume controls
- Menu and pause settings also include `MUSIC VOL` and `FX VOL` sliders
- Music volume affects the live adaptive mix immediately; FX volume is saved and ready for future SFX
- Settings normalization now clamps saved volume values safely into the valid range
- `npm.cmd run build` passes
- `npm.cmd run dev` starts successfully with Vite's native config loader

## In progress
Nothing active.

## Known issues
- Browser autoplay restrictions may delay the first audible music start until player interaction after opting in
- Stem balance and fade timing still need a real feel pass with the current mix
- Vite may skip to a higher port if 5173 is already occupied
- The compact MissionSelect layout still needs a real short-phone check for tap comfort and text density, including the expanded settings modal
- Favor costs and paid-reroll pricing still need balance playtesting together
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No SFX or voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` table must be created manually (see leaderboard plan)

## Next actions
1. Confirm the next app load starts with music off on existing local saves
2. Play through the current opt-in music pass and judge stem balance with the music-volume slider
3. Use the saved FX volume when the first SFX / voice playback pass lands

## Active plan
docs/plans/2026-03-29 1753 Plan - Layered Music System.md

## How to verify
1. Run `npm.cmd run dev` or `npm.cmd run build`
2. Load the game and confirm music is off by default even if it was previously enabled in an older local save
3. Open settings in Menu, MissionSelect, and pause, and confirm `MUSIC VOL` and `FX VOL` sliders appear and persist changes
4. Turn music on and drag `MUSIC VOL`, then confirm the adaptive mix gets quieter/louder immediately

## Recent logs
- docs/log/2026-03-29 1838 Session Wrap and Push.md - wrapped the adaptive music/settings work into a final session snapshot before pushing
- docs/log/2026-03-29 1836 Music Default-Off Migration.md - added a one-time settings migration so older saves no longer auto-enable beta music
- docs/log/2026-03-29 1833 Settings Volume Sliders.md - added persistent music and FX volume sliders and wired music volume into the live mix
- docs/log/2026-03-29 1828 MissionSelect Settings Access.md - added a MissionSelect settings modal with the same core toggles and immediate scanline/music feedback
- docs/log/2026-03-29 1825 Music Default Off and Beta Tag.md - defaulted the music feature to off and marked it as beta in both settings UIs
- docs/log/2026-03-29 1307 Cursor Morph-to-Button Behavior.md - iPad-style morph cursor with per-button corner radius and pointer tracking dot
