# State
_Last updated: 2026-03-27 2308_

## Current focus
Phase 6 polish complete — board wipe, debug menu, salvage rework, tuning.

## What's working
- Full scene flow: Boot -> Menu -> Game with in-scene results
- Core salvage/extract loop, hazards, leaderboard, comms, and HUD remain intact
- Responsive layout drives arena bounds, starfields, gate placement, spawns, overlays, and key UI positioning
- HUD credits text scaled to 14px; pause button is a compact top-right `||` control
- Pause menu panel includes settings toggles (screen shake, scanlines) and a debug spawn section
- Menu scene has settings toggles in top-right corner
- Settings persist to localStorage via SettingsSystem
- Gate preview: large closing circle appears 10s before activation
- Gate active: salvage-style flicker for 3s extractable window with white flash on dim frames
- Bomb power-up: dropped by enemies (25% chance), 1.5s collection delay, BOMB button in bottom-right when held
- Board wipe effect (full white flash, 200ms hold, 1s fade-out) fires on game start, extraction, and bomb detonation — clears all entities with shatter debris
- NPC killed by player shield now drops a bonus point pickup (1.5s collection delay)
- Salvage redesigned as modular space-station rectangles (2-3 perpendicular modules, edge-to-edge)
- Salvage visual size 80px normal / 45px rare — larger than biggest asteroids
- Salvage collection radius reduced to 80 (from 120)
- Asteroid mining ring multiplier reduced to 1.8x (from 3.5x)
- Extraction dialogue always triggers (was 55% chance)
- Screen shake on death, extraction, game entry, and bomb detonation (toggleable in settings)
- Scanline overlay toggleable in settings
- Debug spawn menu in pause screen: spawn shields, points, bombs, salvage, rare salvage, small/large/mineable asteroids
- Asteroid hitboxes use circle-polygon intersection (accounts for player radius)
- Rotating wireframe geo-sphere behind arena on both menu and game scenes
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
- NPC spawn rates, bonus drop values/chances, and pickup targeting may still need tuning
- Save key changed to `ssmt_save` so older local best scores are not migrated
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Windows Firewall may block port `5173` for LAN phone testing
- Supabase `scores` table must be created manually (see leaderboard plan)
- Build still warns about large chunk size because Phaser is bundled as one large client chunk

## Next actions
1. Playtest salvage size/collection radius feel across devices
2. Playtest mining ring (1.8x) proximity mechanic
3. Consider audio implementation (Phase 6 remaining)

## Active plan
None — working from ad-hoc Phase 6 requests.

## How to verify
1. Run `npm.cmd run build` or `npm.cmd run dev -- --host 0.0.0.0`
2. Start a game — confirm white flash + shatter debris + board clear at countdown end
3. Salvage should appear as large modular rectangles, clearly bigger than asteroids
4. Salvage collection ring should be smaller than before (80px)
5. Mineable asteroids should have a tighter mining ring (1.8x body)
6. Kill enemies — bonus pickups drop with 1.5s delay; shield-kill an NPC — bonus drops too
7. Collect a bomb, detonate — all entities shatter into debris + white flash
8. Extract at gate — Slick dialogue always appears, entities shatter, flash + green wipe
9. Pause menu has DEBUG SPAWN section to spawn test entities

## Recent logs
- docs/log/2026-03-27 2308 Phase 6 Polish Salvage and Tuning.md — Salvage rework, board wipe shatter, NPC bonus drops, mining ring tuning, extraction dialogue fix
- docs/log/2026-03-27 2224 Board Wipe and Debug Menu.md — Board wipe effect on bomb/start/extract, debug spawn menu
- docs/log/2026-03-27 2152 Phase 6 Settings Bomb Shake.md — Settings, bomb power-up, screen shake, collection delays
