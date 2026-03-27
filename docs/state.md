# State
_Last updated: 2026-03-27 0028_

## Current focus
Session closed. Leaderboard and Slick comms overlay are implemented. Ready for playtesting and deploy.

## What's working
- Full scene flow: Boot -> Menu -> Game -> GameOver -> Menu/Retry
- Core salvage-risk loop is playable and readable
- Hologram visual style and in-world training-module framing are established
- Online leaderboard on menu screen with daily/weekly tabs (Supabase)
- Player identity: arcade-style callsign (3 letters + 4 digits), persistent
- Score submission on extraction only, fire-and-forget (works offline)
- Slick comms overlay: reusable vector portrait + reactive banter
- Slick speaks on menu intro, run start, phase advance, gate open, shield pickup, extraction, death
- Entry gate: player spawns inside a closing exit gate on game start
- Health system: salvage (15s HP, rare 7.5s) and asteroids (10s*scale HP) deplete while collected
- Depleted entities flash for 3s then destroyed, with HP bar indicator
- Polygon-based hitboxes: collision uses actual geometry (point-in-polygon ray casting)
- Player hitbox is center point only (extremely small); PLAYER_RADIUS=5 for beams
- Screen wipe transitions: green wipe-down on extraction, red wipe-down on death
- Death freeze: 250ms then red wipe
- Exit gate: 50px visual, 20px hitbox, 2s warmup then 3s extractable with pulsing animation
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
- GitHub Pages deployment: https://bahecksher.github.io/SSMT/

## In progress
Nothing active.

## Known issues
- No audio or voiced delivery for Slick yet
- No settings screen (Phase 6)
- No screen shake on death or extraction flash polish
- HP values (15s salvage, 10s asteroid) may need tuning after playtesting
- Beam hazards still span full screen width/height, not clipped to arena
- NPC spawn rates and bump force may need tuning after playtesting
- Save key changed to `ssmt_save` — existing best scores under old key are lost
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH in Git Bash
- Windows Firewall may block port 5173 for LAN phone testing
- Supabase `scores` table must be created manually (SQL in plan doc)
- Chunk size warning on build (1.4MB) — Phaser is large, not actionable without code splitting
- Game-facing title may still be too long; naming direction for Slick's business is not finalized
- Slick portrait size, screen position, and line frequency may need playtest tuning on mobile

## Next actions
1. Deploy latest build to GitHub Pages
2. Playtest Slick panel placement and message frequency on desktop and mobile
3. Decide whether Slick should speak on additional moments (near-misses, streaks, leaderboard)
4. Audio and settings screen (phase 6 items)

## Active plan
docs/plans/2026-03-27 0020 Plan - Slick Character Voice.md

## How to verify
1. Run `npm.cmd run dev -- --host 0.0.0.0` or deploy to GitHub Pages
2. Menu: shows pilot callsign, leaderboard with DAILY/WEEKLY tabs, Slick intro line
3. Play: Slick speaks on run start, phase advance, gate open, shield pickup
4. Extract: score appears on leaderboard, Slick speaks on game over screen
5. Death: Slick speaks on game over screen (different line from extraction)
6. Offline: leaderboard shows "OFFLINE", game still works

## Recent logs
- docs/log/2026-03-27 0028 Session Close.md — Session wrap: leaderboard, Slick direction, Slick comms overlay
- docs/log/2026-03-27 0026 Slick Comms Overlay.md — Added reusable Slick portrait/comms UI and hooked it into major game events
- docs/log/2026-03-27 0020 Slick Character Direction.md — Defined Slick's character direction, voice pillars, and naming recommendation
- docs/log/2026-03-27 0007 Supabase Leaderboard.md — Online leaderboard with daily/weekly tabs, player identity, score submission on extraction
