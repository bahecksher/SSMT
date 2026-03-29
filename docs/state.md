# State
_Last updated: 2026-03-29 0205_

## Current focus
Desktop cursor merge and post-merge sanity checking on the current `Menu`, `MissionSelect`, and in-run flow.

## What's working
- Custom cursor now runs on desktop in `Menu`, `MissionSelect`, and `Game`, replacing the native cursor with a hologram reticle while leaving touch alone
- Full scene flow is now just `Menu -> MissionSelect -> Game`; the unused legacy `GameOverScene` has been removed from runtime config
- MissionSelect still supports accepted contracts, paid rerolls, favor selection, and direct return to menu
- Mission persistence now goes through shared mission helpers instead of raw MissionSelect `localStorage` writes
- Company standing, favor offers, wallet split, and reroll pricing behavior remain intact after the cleanup pass
- Stale liaison select/deselect dialogue helpers and several orphaned tuning/constants were removed without breaking the build
- Production build passed after the cleanup pass

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
1. Desktop-test the new cursor across `Menu`, `MissionSelect`, and `Game` for hover behavior and aiming feel
2. Play one short-phone MissionSelect pass to confirm the cleaned persistence flow and recent spacing tweaks still feel right
3. Continue balance playtesting on the 60/40 wallet split, high favor pricing, and paid rerolls

## Active plan
docs/plans/2026-03-29 0145 Plan - Codebase Cleanup.md

## How to verify
1. Run `npm.cmd run build`
2. On desktop, confirm the native cursor is hidden and the hologram reticle appears in `Menu`, `MissionSelect`, and `Game`
3. From the menu, enter MissionSelect, toggle missions/favors, return to menu, reopen MissionSelect, and confirm selections/rerolls still persist as expected
4. Deploy a run and confirm the normal gameplay/results flow still works without any GameOverScene transition

## Recent logs
- docs/log/2026-03-29 0205 Merge Blake Cursor Branch.md - merged Blake's custom cursor branch into the current flow and kept the GameOverScene cleanup intact
- docs/log/2026-03-29 0150 Codebase Cleanup Pass.md - removed unused scene/data leftovers and routed MissionSelect persistence through shared mission helpers
- docs/log/2026-03-29 0140 Favor Status Badge Consistency.md - moved all favor-card status badges like `SHORT` and `SELECTED` to the lower-right for a consistent layout
- docs/log/2026-03-29 0138 MissionSelect Lower Spacing.md - added more breathing room around the reroll button, wallet line, and favor grid on the briefing screen
