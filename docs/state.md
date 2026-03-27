# State
_Last updated: 2026-03-27 1652_

## Current focus
Gameplay usability polish, currently centered on responsive layout follow-through, live pause behavior, and restoring the arcade-style callsign format.

## What's working
- Full scene flow: Boot -> Menu -> Game with in-scene results
- Core salvage/extract loop, hazards, leaderboard, comms, and HUD remain intact
- Phaser canvas now resizes to the browser viewport instead of staying fixed at `540x960`
- Runtime layout metrics now drive arena bounds, starfields, gate placement, spawns, overlays, and key UI positioning
- Menu and gameplay starfields cover the current viewport with no forced portrait letterboxing
- Arena frame now changes shape with the browser/device size
- Bottom-screen pause button is available during countdown and live gameplay
- The live pause button now uses the `||` pause symbol instead of the word `PAUSE`
- Pause menu now offers `RESUME` and `ABANDON RUN`
- Pause no longer fully freezes the run; it now slows the simulation to a near-stop crawl
- Player control is disabled while paused, but collisions can still kill during the slowed state
- After death or extraction, phases/gates/spawns now freeze while the existing background motion keeps drifting visually
- Abandoning from pause returns directly to the main menu without banking the current run
- Player callsigns now use the `AAA-###` format again
- The menu callsign editor is back to 3 editable letters
- Older saved callsigns now normalize automatically into the restored `AAA-###` format
- Existing menu-to-game background handoff still works with responsive bounds
- Production build passes

## In progress
Nothing active.

## Known issues
- Responsive arena balance may need playtest tuning on very wide or very tall displays
- Mid-run resize/rotation has not been deeply playtested yet
- Pause interactions have not been deeply playtested on mobile touch edge cases yet
- Crawl-speed pause factor may still need feel tuning after playtests
- Result-screen background feel may still need tuning if full-speed motion feels too busy after progression freeze
- Beam hazards still span full screen width/height, not clipped to arena
- No audio or voiced delivery for Slick/Regent yet
- No settings screen (Phase 6)
- No screen shake on death or extraction flash polish
- NPC spawn rates, bonus drop values/chances, and pickup targeting may still need tuning
- Save key changed to `ssmt_save` so older local best scores are not migrated
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` table must be created manually (see leaderboard plan)
- Build still warns about large chunk size because Phaser is bundled as one large client chunk

## Next actions
1. Playtest callsign editing and saved-name migration so restored `AAA-###` identities read well in the menu and leaderboard
2. Playtest crawl-speed pause and abandon flow on desktop and mobile
3. Playtest death/extraction result screens to confirm phase count, gate state, and comm triggers stay frozen

## Active plan
docs/plans/2026-03-27 1652 Plan - Callsign Format Restore.md

## How to verify
1. Run `npm.cmd run build` or `npm.cmd run dev -- --host 0.0.0.0`
2. Start a run and use the bottom button to pause during countdown and during live play
3. Confirm the game slows to an extreme crawl instead of freezing fully
4. Confirm player control is effectively unusable while paused, but a hazard can still kill on collision
5. Press `RESUME` and confirm gameplay returns immediately to full speed with no `3 2 1 GO` countdown
6. Choose `ABANDON RUN` and confirm it returns to the main menu without banking the run
7. Die or extract and confirm the background still moves, but the phase number and gate state stop advancing
8. Confirm no new phase-change or gate-change comm lines fire after the run has ended
9. Confirm result screens and menu navigation still behave normally after using pause
10. Confirm the menu displays the callsign as `AAA-###` and editing requires exactly 3 letters

## Recent logs
- docs/log/2026-03-27 1652 Callsign Format Restore.md — Restored three-letter arcade callsigns and reformatted them as `AAA-###`
- docs/log/2026-03-27 1646 Post-run Progression Freeze.md — Froze phases, gates, spawns, and reactive lines after death/extraction while keeping background motion alive
- docs/log/2026-03-27 1641 Crawl Pause Behavior.md — Replaced hard pause and resume countdown with an ultra-slow danger-live pause state
- docs/log/2026-03-27 1630 Pause Resume Countdown.md — Added a frozen `3 2 1 GO` countdown before gameplay resumes from pause
- docs/log/2026-03-27 1626 Pause Symbol Label.md — Swapped the bottom pause button text from `PAUSE` to `||`
- docs/log/2026-03-27 1623 Pause Feature.md — Added a bottom pause button and pause menu with abandon-run flow
- docs/log/2026-03-27 1609 Responsive Arena Layout.md — Switched the game from fixed portrait sizing to viewport-responsive arena bounds
- docs/log/2026-03-27 1555 Exclusive Comms and Line Refresh.md — Refreshed remaining Slick sim-flavored lines and made Slick/Regent comms mutually exclusive
