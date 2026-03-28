# State
_Last updated: 2026-03-28 1247_

## Current focus
Phase 5+ difficulty rebalanced — drifter density capped, arena-scaled entity counts, reduced debris clutter.

## What's working
- Full scene flow: Boot -> Menu -> Game with in-scene results
- Core salvage/extract loop, hazards, leaderboard, comms, and HUD remain intact
- Responsive layout drives arena bounds, starfields, gate placement, spawns, overlays, and key UI positioning
- Arena density scaling: entity counts normalized to arena size so phone and desktop have equal density
- Drifter count caps at 22 for phase 5+ (down from unbounded 28+), spawn rate plateaus at phase 4 level
- Difficulty at phase 5+ shifts from quantity to lethality (faster, bigger asteroids + beams + enemies)
- Ship debris reduced to 3 fragments / 1s lifetime for less visual clutter
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
- All consumables (bonus, bomb, shield) last 30 seconds with 5-second blink warning before expiry
- Bonus pickups and bombs carry full inertia (no friction), can drift out of arena
- Comm messages display longer: Slick 5.2s, Regent 5.6s
- Asteroid mining ring multiplier 1.8x (from radius)
- Extraction dialogue always triggers
- Screen shake on death, extraction, game entry, and bomb detonation (toggleable in settings)
- Scanline overlay toggleable in settings
- Asteroid hitboxes use circle-polygon intersection (accounts for player radius)
- Rotating wireframe geo-sphere behind arena on both menu and game scenes
- Starfield drifts east-to-west
- All Slick and Regent dialogue updated; Regent triggers kill taunt on ALL deaths at phase 5+
- Player callsigns use `AAA-###` format
- Production build passes with Phaser chunk splitting

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

## Next actions
1. Playtest phase 5+ density on phone vs desktop — verify equal feel
2. Playtest new difficulty curve (drifter cap, speed/size still ramp)
3. Playtest bomb-on-pickup feel and NPC bomb trigger
4. Consider audio implementation

## Active plan
None — working from ad-hoc difficulty tuning requests.

## How to verify
1. Run `npm.cmd run build` or `npm.cmd run dev -- --host 0.0.0.0`
2. Start a game — confirm white flash + shatter debris + board clear at countdown end
3. Reach phase 5 — asteroid count should feel similar to phase 4 (capped at 22)
4. Compare phone vs desktop — density should feel equivalent despite different screen sizes
5. Beams and enemies appear at phase 5, replacing asteroid swarm as primary threat
6. Ship destruction debris clears quickly (3 fragments, ~1s)
7. Die at phase 5+ — Regent should deliver kill taunt regardless of death cause
8. All pickups blink for 5 seconds before their 30-second expiry

## Recent logs
- docs/log/2026-03-28 1247 Phase 5 Density Cap and Arena Scaling.md — drifter cap, spawn plateau, arena density scaling, debris reduction
- docs/log/2026-03-28 0055 Consumable Lifetimes and Comm Duration.md — 30s lifetimes, blink warnings, longer comm display
- docs/log/2026-03-28 0044 Phase 7 Polish and Tuning.md — Beams obliterate entities, difficulty ramp, bomb instant detonate, pickup inertia, UI cleanup
- docs/log/2026-03-27 2308 Phase 6 Polish Salvage and Tuning.md — Salvage rework, board wipe shatter, NPC bonus drops, mining ring tuning, extraction dialogue fix
