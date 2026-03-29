# State
_Last updated: 2026-03-29 1307_

## Current focus
Cursor morph-to-button behavior landed. Ready to push to main and open upstream PR.

## What's working
- Custom cursor morphs to hug interactive elements iPad-style (rounded rect outline, position sticks to element center, pointer tracking dot)
- Per-button corner radius matching via `setData('cornerRadius', N)` on all interactive zones
- Morph crossfades reticle out and rounded rect in, with smooth color lerp (white → neon green)
- Hit detection filtered to `useHandCursor: true` only — blocker zones no longer trigger hover
- Full scene flow: Menu → MissionSelect → Game with cursor morph working across all three
- Leaderboard, mission persistence, company standing, favors, rerolls all intact

## In progress
Nothing active.

## Known issues
- The compact MissionSelect layout still needs a real short-phone check for tap comfort and text density
- Favor costs and paid-reroll pricing still need balance playtesting together
- Global text sharpening and larger font sizing still need an on-device readability check
- Mission HUD shorthand still needs a feel check across longer objective types
- The new run-start liaison opener still needs a feel check when multiple contract companies are active
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No audio or voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` table must be created manually (see leaderboard plan)

## Next actions
1. Push to main and open PR for upstream
2. Desktop-test the morph cursor across Menu, MissionSelect, and Game for hover feel and timing
3. Play one short-phone MissionSelect pass to confirm spacing tweaks still feel right
4. Continue balance playtesting on the 60/40 wallet split, high favor pricing, and paid rerolls

## Active plan
docs/plans/2026-03-29 0145 Plan - Codebase Cleanup.md

## How to verify
1. Run `npm.cmd run build`
2. On desktop, hover over any button — cursor should morph from reticle to rounded rect hugging the button with matching corner radius
3. While morphed, move mouse inside the button area — a small neon dot should track the actual pointer position
4. Move mouse away — cursor should smoothly return to the reticle
5. Confirm morph works on Menu tabs, MissionSelect cards/deploy, pause button, and result screen buttons

## Recent logs
- docs/log/2026-03-29 1307 Cursor Morph-to-Button Behavior.md — iPad-style morph cursor with per-button corner radius and pointer tracking dot
- docs/log/2026-03-29 0209 Land Cursor Merge on Main.md - fast-forwarded main to the merged cursor branch, rebuilt, and prepared origin/main for push
- docs/log/2026-03-29 0205 Merge Blake Cursor Branch.md - merged Blake's custom cursor branch into the current flow and kept the GameOverScene cleanup intact
- docs/log/2026-03-29 0150 Codebase Cleanup Pass.md - removed unused scene/data leftovers and routed MissionSelect persistence through shared mission helpers
- docs/log/2026-03-29 0140 Favor Status Badge Consistency.md - moved all favor-card status badges like `SHORT` and `SELECTED` to the lower-right for a consistent layout
