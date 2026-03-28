# State
_Last updated: 2026-03-28 0044_

## Current focus
Phase 7 polish complete — beams obliterate entities, difficulty ramp, bomb/pickup physics, UI cleanup.

## What's working
- Full scene flow: Boot -> Menu -> Game with in-scene results
- Core salvage/extract loop, hazards, leaderboard, comms, and HUD remain intact
- Responsive layout drives arena bounds, starfields, gate placement, spawns, overlays, and key UI positioning
- HUD credits text scaled to 14px; pause button is a compact top-right `||` / `▶` control
- Pause menu panel has abandon run and settings toggles (screen shake, scanlines) — no resume button, resume only via top-right button
- Menu scene has settings toggles in top-right corner
- Settings persist to localStorage via SettingsSystem
- Gate preview: large closing circle appears 10s before activation
- Gate active: salvage-style flicker for 3s extractable window with white flash on dim frames
- Bomb power-up: dropped by enemies (25% chance), detonates instantly on player collection (board wipe)
- NPC bomb collection triggers board wipe AND kills the player
- Board wipe effect (full white flash, 200ms hold, 1s fade-out) fires on game start, extraction, and bomb detonation — clears all entities with shatter debris
- Beams obliterate everything: asteroids (shatter), enemies (drop bonus), NPCs (drop shield/bonus), salvage
- Beam width scales aggressively per phase (20px at ph5 → 120px cap)
- Beam burst system: rapid-fire beams at phase 8+ with short delays between each
- Beams and enemies both start at phase 5
- NPC killed by player shield drops a bonus point pickup
- Salvage redesigned as modular space-station rectangles (2-3 perpendicular modules, edge-to-edge flush)
- Salvage visual size 80px normal / 45px rare — larger than biggest asteroids
- Salvage collection radius 80px for both normal and rare
- Small asteroids (radiusScale < 1.5) no longer show mining circles
- Bonus pickups and bombs carry full inertia (no friction), can drift out of arena
- Asteroid mining ring multiplier 1.8x (from radius)
- Extraction dialogue always triggers
- Screen shake on death, extraction, game entry, and bomb detonation (toggleable in settings)
- Scanline overlay toggleable in settings
- Asteroid hitboxes use circle-polygon intersection (accounts for player radius)
- Rotating wireframe geo-sphere behind arena on both menu and game scenes
- Starfield drifts east-to-west
- All Slick and Regent dialogue updated; Regent triggers kill taunt on ALL deaths at phase 5+
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
1. Playtest new difficulty curve (beams at phase 5, burst system, width scaling)
2. Playtest bomb-on-pickup feel and NPC bomb trigger
3. Consider audio implementation

## Active plan
None — working from ad-hoc Phase 7 requests.

## How to verify
1. Run `npm.cmd run build` or `npm.cmd run dev -- --host 0.0.0.0`
2. Start a game — confirm white flash + shatter debris + board clear at countdown end
3. Reach phase 5 — beams and enemies should both appear
4. Beams should destroy asteroids, enemies, NPCs, and salvage on contact
5. Kill enemies — bonus pickups drift with full inertia (no friction slowdown)
6. Collect a bomb — should immediately detonate (no button), board wipe fires
7. Let NPC collect a bomb — board wipe + player death
8. Die at phase 5+ — Regent should deliver kill taunt regardless of death cause
9. Small asteroids should have no mining circle
10. Pause menu has no resume button — only the top-right ▶ button resumes

## Recent logs
- docs/log/2026-03-28 0044 Phase 7 Polish and Tuning.md — Beams obliterate entities, difficulty ramp, bomb instant detonate, pickup inertia, UI cleanup
- docs/log/2026-03-27 2308 Phase 6 Polish Salvage and Tuning.md — Salvage rework, board wipe shatter, NPC bonus drops, mining ring tuning, extraction dialogue fix
- docs/log/2026-03-27 2224 Board Wipe and Debug Menu.md — Board wipe effect on bomb/start/extract, debug spawn menu
