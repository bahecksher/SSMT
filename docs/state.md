# State
_Last updated: 2026-03-26 2332_

## Current focus
Added NPC ships, renamed to Slick's Salvage & Mining Operation Training Module, deployed to GitHub Pages. Ready for playtesting.

## What's working
- Full scene flow: Boot -> Menu -> Game -> GameOver -> Menu/Retry
- Entry gate: player spawns inside a closing exit gate on game start
- Health system: salvage (15s HP, rare 7.5s) and asteroids (10s*scale HP) deplete while collected
- Depleted entities flash for 3s then destroyed, with HP bar indicator
- Polygon-based hitboxes: collision uses actual geometry (point-in-polygon ray casting)
- Player hitbox is center point only (extremely small); PLAYER_RADIUS=5 for beams
- Screen wipe transitions: green wipe-down on extraction, red wipe-down on death
- Death freeze: 250ms then red wipe
- Exit gate: 50px visual, 20px hitbox, 2s warmup then 3s extractable with pulsing animation
- Extraction triggers immediately on entering the active gate
- Mobile input: invisible virtual joystick with inertia
- Desktop input: pointer-follow (unchanged)
- Ship is a small triangle that rotates to face heading; center dot shows hitbox
- Asteroid mining zones clearly visible with orange pulsing fill + dashed ring
- Salvage debris drifts in from edge, despawns offscreen, respawns after ~1.5s
- Rare salvage (purple, phase 2+): smaller radius, higher points, 10s lifetime with blink
- Drifter asteroids bounce/split on collision; sizes vary per phase
- Shield power-up spawns near salvage, absorbs one hit, destroys/splits asteroid
- Enemy ships (phase 5+) steer toward player, smash through asteroids
- Beam hazards (phase 7+) fire 1-3 volleys with double red flash warning
- NPC ships (phase 2+): amber triangles navigate to salvage, deplete HP, killed by asteroids/enemies
- NPC bump: player can push NPCs away from salvage (impulse force, no kill)
- NPC death drops shields: hazard-killed NPCs spawn a shield pickup at death position
- Enemies hunt NPCs: enemy ships target nearby NPCs when closer than player
- Difficulty scales per phase with gentler ramp
- Exit gate spawns every 30s, open 5s (2s warmup + 3s active), extraction banks score
- Best score persists in localStorage
- HUD: CREDITS, best score, gate countdown, phase counter, shield status
- Hologram visual style with scanline overlay
- GitHub Pages deployment: https://bahecksher.github.io/SSMT/

## In progress
Nothing active.

## Known issues
- No audio (Phase 6)
- No settings screen (Phase 6)
- No screen shake on death or extraction flash polish
- HP values (15s salvage, 10s asteroid) may need tuning after playtesting
- Beam hazards still span full screen width/height, not clipped to arena
- NPC spawn rates and bump force may need tuning after playtesting
- Save key changed to `ssmt_save` — existing best scores under old key are lost
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH in Git Bash
- Windows Firewall may block port 5173 for LAN phone testing

## Next actions
1. Playtest NPC behavior — do they feel like other players? Are spawn rates right?
2. Tune NPC bump force and salvage drain rate
3. Audio and settings screen (phase 6 items)

## Active plan
docs/plans/2026-03-25 2328 Plan - Gameplay Feel and Difficulty.md

## How to verify
1. Play live at https://bahecksher.github.io/SSMT/
2. Or locally: In Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`
3. Run: `npm.cmd install`
4. Run: `npm.cmd run dev -- --host 0.0.0.0`
5. Desktop: `http://localhost:5173/SSMT/`
6. Test: title screen reads "SLICK'S / SALVAGE & MINING / OPERATION TRAINING MODULE"
7. Test: reach phase 2 — amber NPC ships spawn from edges and head toward salvage
8. Test: NPCs deplete salvage HP (watch the HP bar go down without you collecting)
9. Test: fly into an NPC — it gets pushed away, not killed
10. Test: asteroids and enemies destroy NPCs, dropping shield pickups

## Recent logs
- docs/log/2026-03-26 2332 NPC Ships Rename and GitHub Pages.md — NPC ships, game rename, GitHub Pages deployment
- docs/log/2026-03-26 2231 Health HP Hitboxes and Gate Tuning.md — Health system, polygon hitboxes, screen wipes, gate grace period/pulsing, HP tuning
- docs/log/2026-03-26 2158 Mobile Controls and Visual Polish.md — Invisible joystick controls, hitbox visibility, mining zone glow, triangle ship, difficulty rebalance
- docs/log/2026-03-26 1645 Mobile Access Firewall Attempt.md — Confirmed LAN IP and narrowed phone access issue to firewall/admin permissions
