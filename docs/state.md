# State
_Last updated: 2026-04-02 1813_

## Current focus
Session wrapped after turning the mission tracker hide/show behavior into a slide-and-fade transition so bottom comms take over that lane more gracefully.

## What's working
- Runtime scene flow remains `Menu -> MissionSelect -> Game`, with layered music/settings work still intact
- Menu and MissionSelect still share the drifting background layer and preserve background state handoffs across scenes
- MissionSelect favor cards now show liaison/company identity plus a fixed favor offer and purchase state without rep standing/progress copy
- Favors no longer depend on rep for unlocks or scaling; each company now sells one fixed offer
- Rep still accrues from completed missions and now maps to a leaderboard company by highest saved company rep
- Leaderboard fetch/submit now supports an optional `company_id` field and falls back cleanly if the server has not been migrated yet
- Menu leaderboard rows now show a compact company tag and company-colored text when company affiliation is present
- `GameScene` uses the original/default arena framing again instead of the temporary symmetric gameplay reserve
- Gameplay comms still anchor to the bottom of the screen and use a compact bottom-pinned layout with tighter spacing, smaller portraits, and improved readability opacity
- Active mission pills now animate out with an upward slide and fade when a gameplay comm appears, then slide back in when the comm clears
- Result overlays still use full-width `DESTROYED` / `EXTRACT` bars, and result-state comm panels still keep the fuller pinned layout
- `npm.cmd run build` passes

## In progress
Nothing active.

## Known issues
- Browser autoplay restrictions may delay the first audible music start until player interaction after opting in
- Stem balance and fade timing still need a real feel pass with the current mix
- The recent readability/menu/result/mobile-HUD/favor-card/comm-layout passes still need a real phone/desktop visual playcheck for clipping, density, and transition feel
- Retry after extraction still bypasses MissionSelect, so changing favors or contracts requires returning to menu
- Beam hazards still span full screen width/height, not clipped to arena
- No SFX or voiced delivery for Slick, Regent, or liaisons yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` still needs a nullable `company_id` column added server-side before new submissions can persist company affiliation

## Next actions
1. Run the server-side `company_id` migration for the `scores` table
2. Playcheck the bottom comm plus mission-tracker slide behavior on a phone-sized viewport
3. Resume the adaptive music feel pass, especially stem balance and volume behavior

## Active plan
docs/plans/2026-03-29 1753 Plan - Layered Music System.md

## How to verify
1. Run `npm.cmd run build`
2. Start a run and trigger Slick, Regent, or liaison comms
3. Confirm the arena is still using the original/default gameplay dimensions
4. Confirm active mission pills slide upward and fade out when a gameplay comm appears
5. Confirm the mission pills slide back in after the comm clears

## Recent logs
- docs/log/2026-04-02 1813 Mission Tracker Slide Hide for Gameplay Comms.md - changed mission pills from a hard visibility toggle to a slide-and-fade transition under gameplay comms
- docs/log/2026-04-02 1812 Bottom Comm Readability Opacity Follow-up.md - increased compact bottom comm opacity after the first transparent pass was too light to read clearly
- docs/log/2026-04-02 1810 Compact Transparent Bottom Gameplay Comms.md - made bottom gameplay comms thinner and more transparent without changing the restored arena framing
- docs/log/2026-04-02 1806 Restore Original Arena Dimensions.md - removed the temporary gameplay inset override and returned the arena to its original framing
