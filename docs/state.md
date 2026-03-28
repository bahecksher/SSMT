# State
_Last updated: 2026-03-27 1826_

## Current focus
UI polish pass and gate rework — fixing scaling issues from the responsive layout change and reworking gate visuals for better anticipation.

## What's working
- Full scene flow: Boot -> Menu -> Game with in-scene results
- Core salvage/extract loop, hazards, leaderboard, comms, and HUD remain intact
- Responsive layout drives arena bounds, starfields, gate placement, spawns, overlays, and key UI positioning
- HUD credits text scaled down to 14px to fit responsive viewports
- Pause button relocated to top-right corner with compact 44x28 design
- Pause menu panel enlarged (0.34 height) so RESUME, ABANDON RUN, and hint text all fit inside the border
- Gate timer removed from HUD
- "BEST" score removed from destroyed/extracted results overlay
- Asteroid hitboxes now use circle-polygon intersection (accounts for player radius), fixing visual mismatch on large asteroids
- Gate preview: large closing circle appears 10s before gate activates, giving the player time to navigate toward it
- Gate active: flickering on/off (accelerating blink) for 3s extractable window, with white flash on blink-out
- Comms trigger when gate becomes extractable, not when it first appears
- Rotating wireframe geo-sphere behind the arena (bottom-right corner, partially visible)
- Player callsigns use `AAA-###` format
- Production build passes

## In progress
Nothing active.

## Known issues
- Responsive arena balance may need playtest tuning on very wide or very tall displays
- Mid-run resize/rotation has not been deeply playtested yet
- Pause interactions have not been deeply playtested on mobile touch edge cases yet
- Crawl-speed pause factor may still need feel tuning after playtests
- Gate flicker speed and closing-circle timing may need feel tuning after playtests
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
1. Playtest gate closing-circle preview and flickering active state for readability and feel
2. Playtest asteroid hitbox accuracy with the circle-polygon collision
3. Playtest pause button in top-right on desktop and mobile

## Active plan
None — working from ad-hoc polish requests.

## How to verify
1. Run `npm.cmd run build` or `npm.cmd run dev -- --host 0.0.0.0`
2. Start a run and verify credits text is smaller, pause button is top-right
3. Wait ~20s and watch the closing circle appear around the gate location
4. When the circle reaches the gate, confirm it starts flickering with white flashes on blink-out
5. Fly into the flickering gate to confirm extraction works during the 3s window
6. Die and confirm no "BEST" score on the destroyed overlay
7. Confirm the wireframe geo-sphere is visible in the bottom-right corner behind the arena
8. Pause and confirm all content fits inside the pause panel

## Recent logs
- docs/log/2026-03-27 1826 UI Polish and Gate Rework.md — HUD fixes, gate rework with closing-circle preview and flicker, geo-sphere background
- docs/log/2026-03-27 1652 Callsign Format Restore.md — Restored three-letter arcade callsigns and reformatted them as `AAA-###`
- docs/log/2026-03-27 1646 Post-run Progression Freeze.md — Froze phases, gates, spawns, and reactive lines after death/extraction while keeping background motion alive
- docs/log/2026-03-27 1641 Crawl Pause Behavior.md — Replaced hard pause and resume countdown with an ultra-slow danger-live pause state
