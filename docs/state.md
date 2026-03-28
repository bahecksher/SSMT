# State
_Last updated: 2026-03-27 2127_

## Current focus
UI polish and visual additions — fixing responsive scaling issues, reworking gate visuals, adding background geo-sphere, and updating dialogue.

## What's working
- Full scene flow: Boot -> Menu -> Game with in-scene results
- Core salvage/extract loop, hazards, leaderboard, comms, and HUD remain intact
- Responsive layout drives arena bounds, starfields, gate placement, spawns, overlays, and key UI positioning
- HUD credits text scaled to 14px; pause button is a compact top-right `||` control
- Gate timer removed from HUD
- Pause menu panel fits all content (RESUME, ABANDON RUN, hint) on all screen sizes
- Results screen: no "BEST" score, comms/retry/menu anchored to avoid overlap on short screens
- Menu layout: how-to-play and TAP TO START anchored from bottom; leaderboard rows capped to available space
- Gate preview: large closing circle appears 10s before activation
- Gate active: salvage-style flicker for 3s extractable window with white flash on dim frames
- Comms trigger when gate becomes extractable
- Asteroid hitboxes use circle-polygon intersection (accounts for player radius)
- Rotating wireframe geo-sphere behind arena on both menu and game scenes (bottom-right corner)
- Starfield drifts east-to-west
- All Slick and Regent dialogue updated; Regent `threatDetected` triggers sometimes at phase 2
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
1. Playtest gate closing-circle preview and flickering active state on desktop and mobile
2. Playtest death/extraction result screen layout on multiple phone sizes
3. Playtest menu leaderboard layout on short/wide screens

## Active plan
None — working from ad-hoc polish requests.

## How to verify
1. Run `npm.cmd run build` or `npm.cmd run dev -- --host 0.0.0.0`
2. Confirm credits text is small, pause button is top-right `||`
3. Wait ~20s and watch the closing circle appear around the gate location
4. When the circle reaches the gate, confirm it starts flickering with white flashes
5. Fly into the flickering gate to confirm extraction works during the 3s window
6. Die and confirm comms don't overlap TAP TO RETRY; no "BEST" score shown
7. Confirm the wireframe geo-sphere is visible in the bottom-right corner on both menu and game
8. Confirm starfield drifts right-to-left
9. On a phone, confirm menu leaderboard and how-to-play don't overlap
10. Pause and confirm all content fits inside the pause panel

## Recent logs
- docs/log/2026-03-27 2127 UI Polish and Visual Additions.md — Full session: HUD fixes, gate rework, geo-sphere, dialogue updates, phone layout fixes
- docs/log/2026-03-27 1652 Callsign Format Restore.md — Restored three-letter arcade callsigns
- docs/log/2026-03-27 1646 Post-run Progression Freeze.md — Froze phases/gates/spawns after death/extraction
- docs/log/2026-03-27 1641 Crawl Pause Behavior.md — Ultra-slow danger-live pause state
