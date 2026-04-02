# State
_Last updated: 2026-04-02 1709_

## Current focus
Session wrapped after moving Slick's menu comm panel below the leaderboard and removing the old menu how-to-play instruction block.

## What's working
- Runtime scene flow remains `Menu -> MissionSelect -> Game`, with layered music/settings work still intact
- Menu and MissionSelect both run the same drifting background layer: overscanned starfield, geo-sphere, salvage debris, drifters, and NPC ships
- Background state snapshots still carry forward between Menu, MissionSelect, and Game
- Menu leaderboard now leaves dedicated space for Slick's menu comm panel beneath it, and the `TAP TO START` footer remains clear without the old instruction copy
- Result overlays still size from the arena bounds, with larger titles/score text and more balanced vertical spacing for mission results, comm panels, and buttons
- Menu, MissionSelect, HUD, pause/results UI, comm panels, and floating credit popups still use the larger readability pass sizing
- Slick, Regent, and liaison comm windows still auto-size to wrapped text
- MissionSelect favor cards still use the larger portrait-forward layout and expanded spacing pass
- `npm.cmd run build` passes

## In progress
Nothing active.

## Known issues
- Browser autoplay restrictions may delay the first audible music start until player interaction after opting in
- Stem balance and fade timing still need a real feel pass with the current mix
- The recent readability/favor-card/menu portrait/background/result-layout/menu-layout passes still need a real phone/desktop visual playcheck for clipping, density, and transition feel
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No SFX or voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` table must be created manually (see leaderboard plan)

## Next actions
1. Playcheck the menu on desktop and a short phone viewport to confirm the leaderboard, Slick comm panel, and `TAP TO START` spacing all feel balanced
2. Tune any remaining cramped or low-contrast UI discovered in that live sweep
3. Resume the adaptive music feel pass, especially stem balance and volume behavior

## Active plan
docs/plans/2026-03-29 1753 Plan - Layered Music System.md

## How to verify
1. Run `npm.cmd run build`
2. Open the menu and confirm the old three-line instruction copy is gone
3. When Slick's intro comm appears, confirm it sits beneath the leaderboard instead of at the top of the menu
4. Confirm the leaderboard rows, comm panel, and `TAP TO START` prompt all remain separated cleanly on the menu screen

## Recent logs
- docs/log/2026-04-02 1709 Menu Comm Placement Pass.md - moved Slick's menu comm below the leaderboard, removed the old instruction text, and re-verified the build
- docs/log/2026-04-02 1705 Result Screen Arena Layout Pass.md - resized and re-centered the death/extract overlays around the arena and re-verified the build
- docs/log/2026-04-02 1659 MissionSelect Living Background.md - carried the menu's live background into MissionSelect and preserved handoffs forward/backward between scenes
- docs/log/2026-04-02 1653 Favor Card Size and Spacing Pass.md - enlarged the favor cards, spread their content vertically, and re-verified the build
