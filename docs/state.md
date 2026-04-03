# State
_Last updated: 2026-04-03 0130_

## Current focus
Wrap the portrait-art session cleanly with the cast on the newer layered holo treatment, Slick on the more humanoid feminine pass, and all portraits now omitting mouth marks.

## What's working
- Slick, Regent, and all four liaison portraits use the layered holo rendering pass across menu, MissionSelect, and comm panels
- Slick now reads more humanoid and feminine while staying in the same shared portrait language
- Explicit mouth marks are removed from all active portraits
- Shared portrait primitives keep the cast portrait treatment consistent across the reused portrait factories
- `npm.cmd run build` passes on the current worktree

## In progress
- No blocked implementation work remains from the portrait pass; the remaining follow-up is visual playcheck and taste tuning

## Known issues
- Browser autoplay restrictions still require an initial player interaction before audio can become audible on some fresh browser sessions
- The soundtrack and SFX still need a real feel pass for balance, overlap, and loudness
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` still needs a nullable `company_id` column added server-side before new submissions can persist company affiliation

## Next actions
1. Eyeball the portrait pass on menu, MissionSelect, and live comm panels on desktop and phone-sized layouts
2. Confirm the no-mouth art direction still leaves enough expression and readability at small sizes
3. Resume the broader soundtrack/SFX feel pass once the portrait look is signed off

## Active plan
docs/plans/2026-04-03 0113 Plan - Comm Portrait Rendering Pass.md

## How to verify
1. Run `npm.cmd run build`
2. Open the menu and confirm Slick reads as a humanoid feminine holo portrait with no explicit mouth marks
3. Trigger Slick, Regent, and liaison comms and confirm none of the portraits show mouth lines or lower-face grille marks
4. Open MissionSelect and confirm the liaison portraits still read clearly on the favor cards

## Recent logs
- docs/log/2026-04-03 0130 Session Wrap-Up.md — wrapped the portrait session for handoff and git closeout
- docs/log/2026-04-03 0128 Portrait Mouth Removal.md — removed explicit mouth marks from all cast portraits
- docs/log/2026-04-03 0125 Slick Humanoid Portrait Pass.md — pushed Slick further toward a humanoid feminine holo portrait
