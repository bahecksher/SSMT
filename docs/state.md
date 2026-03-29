# State
_Last updated: 2026-03-29 0035_

## Current focus
Post-push playtesting and balance for the mission/favor economy, run opener comms, and mobile readability.

## What's working
- Full scene flow: `Menu -> MissionSelect -> Game`, with retry still skipping the briefing
- MissionSelect uses an adaptive layout that keeps mission cards, favor cards, comms, and deploy usable on shorter phone screens
- MissionSelect text, favor state treatment, and mission-card spacing are larger and clearer than before
- Bottom mission pills now use readable mission-specific shorthand instead of blunt raw-text truncation
- Briefing-screen liaison chatter has been removed; run start now opens with Slick when no contracts are active or a matching liaison when contracts are active
- Company rep unlocks favor tiers, wallet credits pay for favors, and extraction banks 35% to wallet while Slick keeps 65%
- Death retry preserves purchased favors; extraction retry starts fresh
- Gameplay and results comm panels have smaller footprints, larger text, priority/cooldown handling, and centered results placement
- Recent mission-system, wallet, comm, and mobile UI work is committed and pushed to `origin/main`
- Production build passed on the latest gameplay/UI change set

## In progress
Nothing active.

## Known issues
- Favor costs and the 35% wallet payout rate still need balance playtesting
- MissionSelect still has no explicit "insufficient funds" feedback beyond non-selectable cards
- The compact MissionSelect layout still needs a real short-phone check for tap comfort and text density
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
1. Play one short-phone MissionSelect pass to validate card density, favor readability, and tap comfort
2. Run one no-contract opener and one active-contract opener to validate the new comm handoff
3. Tune favor costs and the 35% wallet payout after a few extract-spend cycles

## Active plan
docs/plans/2026-03-28 2357 Plan revision - Mission System Economy.md

## How to verify
1. Run `npm.cmd run build`
2. Open MissionSelect on a phone-sized viewport and confirm the mission cards fit comfortably with favors visible
3. Start a run with active contracts and confirm the bottom tracker pills stay readable
4. Toggle a favor on and off and confirm the card clearly changes state
5. Extract once and confirm the results screen shows the wallet payout and Slick's cut

## Recent logs
- docs/log/2026-03-29 0035 Git Push.md - committed and pushed the pending mission economy and mobile UI batch to `origin/main`
- docs/log/2026-03-29 0031 Mission HUD and Card Spacing.md - improved bottom mission readability and removed dead space from mission cards
- docs/log/2026-03-29 0028 Favor Selection State.md - added a clear selected badge and stronger active-state treatment for favor cards
- docs/log/2026-03-29 0022 MissionSelect Text and Run Opener.md - enlarged MissionSelect text and moved contract chatter to the run opener
