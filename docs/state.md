# State
_Last updated: 2026-03-27 1330_

## Current focus
Gameplay polish pass is centered on readable comms and contested arena pickups, with proximity-based rewards across both mining and salvage.

## What's working
- Full scene flow: Boot -> Menu -> Game (in-scene results, no separate GameOver scene)
- Core salvage-risk loop is playable and readable
- Live phase-1 simulation behind menu screen (asteroids, salvage, hologram overlay)
- Seamless transition: menu background entities carry into gameplay
- 3-2-1 countdown with gate sync before active play begins
- 2-second invulnerability on run start with blinking visual indicator
- Arena simulation continues during countdown, death wipe, and result overlays
- Players can tap their menu callsign and choose the 3-letter prefix
- Callsign format: chosen 3 letters + persistent 4-digit suffix
- Semi-live death/extraction result overlays (arena keeps moving in background)
- Ship destruction debris: all ships (player, NPC, enemy) break apart into fragments carrying inertia
- Death: immediate red wipe, player ship shatters, fragments drift with momentum
- Salvage shatter: depleted/expired salvage breaks apart with debris effect
- Shield drops inherit NPC velocity and drift realistically
- Enemy ships always drop collectible bonus-point pickups when destroyed in the arena
- NPC hazard deaths sometimes drop collectible bonus-point pickups alongside existing shield logic
- Bonus-point pickups drift and expire, but do not magnetize toward the player
- NPCs can target and collect shield drops and bonus collectibles
- NPC-held shields absorb one hazard hit and can pop enemies/asteroids instead of killing the NPC immediately
- Proximity-based asteroid mining: 1 pts/sec at edge, up to 15 pts/sec danger-close
- Proximity-based salvage scoring: closer to the salvage core pays more than staying at the edge of the ring
- Rare salvage still multiplies rewards and now also benefits from proximity scoring
- How-to-play instructions on menu screen
- Hologram visual style and in-world training-module framing
- Online leaderboard on menu screen with daily/weekly tabs (Supabase)
- Score submission on extraction only, fire-and-forget (works offline)
- Slick comms overlay: smaller top-center panel with slimmer footprint
- Regent comms overlay: smaller top-center panel in the same slot as Slick
- Slick speaks on run start, gate open, and occasionally on gate close (50% chance)
- Regent announces first enemy arrival (phase 5+), beam activation (phase 7), frustration every phase after 7
- Starfield drifts subtly downward for ambient motion
- Entry gate: player spawns inside a closing exit gate synced to countdown
- Health system: salvage (15s HP, rare 7.5s) and asteroids (10s*scale HP) deplete while collected
- Overlapping mining/salvage gain feedback reflects actual stacked score
- Depleted entities flash for 3s then shatter with debris effect
- Polygon-based hitboxes: collision uses actual geometry (point-in-polygon ray casting)
- Player hitbox is center point only (extremely small); PLAYER_RADIUS=5 for beams
- Screen wipe transitions: green wipe-down on extraction, red wipe-down on death
- Exit gate: 50px visual, 20px hitbox, 2s warmup then 3s extractable with pulsing animation
- Mobile input: invisible virtual joystick with inertia
- Desktop input: pointer-follow (unchanged)
- Ship is a small triangle that rotates to face heading; center dot shows hitbox
- Asteroid mining zones clearly visible with orange pulsing fill + dashed ring
- Salvage debris drifts in from edge, despawns offscreen, respawns after ~1.5s
- Rare salvage (purple, phase 2+): smaller radius, higher points, 12s lifetime with blink
- Drifter asteroids split or shatter on collision; sizes vary per phase
- Shield power-up spawns near salvage, absorbs one hit, destroys/splits asteroid
- Enemy ships (phase 5+) steer toward player, smash through asteroids
- Beam hazards (phase 7+) fire 1-3 volleys with double red flash warning
- NPC ships (phase 2+): amber triangles navigate to salvage, deplete HP, killed by asteroids/enemies
- NPC bump: player can push NPCs away from salvage (impulse force, no kill)
- NPC death drops shields only when the drop would land fully inside the arena
- Enemies hunt NPCs: enemy ships target nearby NPCs when closer than player
- Difficulty scales per phase with gentler ramp
- Exit gate spawns every 30s, open 5s (2s warmup + 3s active), extraction banks score
- Best score persists in localStorage
- HUD: CREDITS, best score, gate countdown, phase counter, shield status
- GitHub Pages deployment: https://bahecksher.github.io/SSMT/

## In progress
Nothing active.

## Known issues
- No audio or voiced delivery for Slick/Regent yet
- No settings screen (Phase 6)
- No screen shake on death or extraction flash polish
- Beam hazards still span full screen width/height, not clipped to arena
- NPC spawn rates, NPC bonus drop chance, bonus-point values, and pickup targeting may need playtest tuning
- Salvage proximity curve may need tuning if edge play feels too weak or core play feels too dominant
- Save key changed to `ssmt_save` - existing best scores under old key are lost
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH in Git Bash
- Windows Firewall may block port 5173 for LAN phone testing
- Supabase `scores` table must be created manually (SQL in plan doc)
- Chunk size warning on build (1.45MB) - Phaser is large, not actionable without code splitting
- Game-facing title may still be too long; naming direction for Slick's business is not finalized
- Slick portrait size and line frequency may need playtest tuning on mobile
- Regent line frequency and shared-slot presentation may need mobile tuning

## Next actions
1. Playtest salvage proximity scoring on desktop and mobile
2. Tune salvage and NPC pickup curves if they feel too punishing or too generous
3. Continue into audio and settings screen (phase 6 items)

## Active plan
docs/plans/2026-03-27 0020 Plan - Slick Character Voice.md

## How to verify
1. Run `npm.cmd run dev -- --host 0.0.0.0` or `npm.cmd run build`
2. Enter a salvage ring and confirm scoring starts low at the edge and increases as you push closer to the core
3. Check that salvage floating score text becomes punchier when hugging the core, similar to asteroid mining
4. Confirm rare salvage still pays substantially more, with proximity scaling layered on top
5. Confirm asteroid mining, bonus collectibles, NPC pickups, extraction, and result overlays still behave normally

## Recent logs
- docs/log/2026-03-27 1330 Salvage Proximity.md - Applied asteroid-style proximity scoring to salvage zones
- docs/log/2026-03-27 1328 NPC Pickup Contest.md - Restored drifting bonus collectibles without attraction and let NPCs collect shields/bonuses
- docs/log/2026-03-27 1321 Remove Bonus Pickup.md - Switched kill-reward bonuses from collectibles to instant score awards
