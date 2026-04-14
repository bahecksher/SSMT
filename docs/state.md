# State
_Last updated: 2026-04-14 0107_

## Current focus
Arcade-only polish and clearer corporation progression UI: menu affiliation remains rep-gated, MissionSelect shows rep/standing, and the rep earn rule is now stated before and after runs.

## What's working
- The main menu remains arcade-only with no accessible campaign entry point
- The `WORKING WITH` slot in the menu is a corporation selector button instead of read-only text
- Players can always remain `FREE AGENT`, and the selector only offers corporations where they currently have positive saved rep
- The chosen affiliation persists locally and drives leaderboard tagging, corporation leaderboard footer copy, and corporation-colored arena/UI presentation
- MissionSelect contract cards show both credit reward and rep payout
- MissionSelect now explicitly says accepted contracts pay bonus credits and company rep on extraction
- Locked favor cards now point players toward completing contracts to unlock company standing
- Extraction results now show the company rep earned from completed contracts, and death results state that extraction is required to claim rep
- `npm.cmd run build` passes

## In progress
- Browser playtesting to confirm the denser MissionSelect and results copy stays comfortable on narrow mobile screens
- Browser playtesting to confirm live leaderboard submissions land under the manually selected unlocked corporation
- Product decision on whether the cycling selector is enough long-term or should later become a richer corporation picker

## Known issues
- Dormant campaign-specific code and save fields still exist in the codebase even though campaign is no longer player-accessible
- Supabase `scores` and `losses` still need nullable `company_id` columns server-side for corporation-tagged boards and loss rows to populate fully
- Local `BEST` score is still shared across the historical campaign/arcade save model even though only arcade is now accessible
- Background simulation remains duplicated between MenuScene and MissionSelectScene
- Settings UI remains duplicated across MenuScene, MissionSelectScene, and GameScene pause menu
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Retry/continue after extraction still bypasses MissionSelect for a direct next run
- Beam hazards still span full screen width/height, not clipped to arena
- Boss encounter balance is not tuned yet for all screen sizes or for long post-kill survival windows
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly

## Next actions
1. Playtest MissionSelect on a phone-sized viewport and confirm the rep rule text does not crowd the contract stack
2. Complete and fail a few contracts and confirm the extraction/death results explain the rep outcome clearly
3. Submit arcade scores under different unlocked corporations and confirm the `CORPS` board groups them as expected

## Active plan
docs/plans/2026-04-14 0107 Plan - Company Rep Clarity.md

## How to verify
1. Run `npm.cmd run build`
2. Open MissionSelect and confirm the header says accepted contracts pay bonus credits and rep on extraction
3. Confirm mission cards show `+REP` and locked favor cards point to completing contracts
4. Complete accepted contracts, extract, and confirm the results screen shows total company rep gained plus per-mission rep payout
5. Die after completing progress and confirm the results screen says extraction was required to claim company rep

## Recent logs
- docs/log/2026-04-14 0107 Company Rep Clarity.md — clarified how company rep is earned and when it is claimed
- docs/log/2026-04-14 0101 MissionSelect Reputation Visibility.md — restored mission rep payout display and company standing visibility on MissionSelect
- docs/log/2026-04-14 0056 Rep-Gated Corporation Selector.md — restricted the corporation selector to rep-unlocked corporations while keeping `FREE AGENT`
- docs/log/2026-04-14 0054 Manual Corporation Selector.md — replaced the read-only affiliation text with a persisted corporation selector button
- docs/log/2026-04-14 0045 Campaign Access Removal.md — removed campaign from the accessible flow and normalized stale selected mode back to arcade
