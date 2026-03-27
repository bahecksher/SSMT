# State
_Last updated: 2026-03-27 1456_

## Current focus
Gameplay polish pass is centered on making the arena feel alive from the first moment, with readable telegraphing, cleaner death feedback, and tighter result-screen presentation.

## What's working
- Full scene flow: Boot -> Menu -> Game (in-scene results, no separate GameOver scene)
- Core salvage-risk loop is playable and readable
- Live menu simulation now includes salvage, asteroids, and NPC scavengers moving through the field
- Menu NPCs can chase salvage and die to hazards, but menu mode does not spawn shields or bonus-point pickups
- Seamless transition: menu background entities carry into gameplay, including NPCs
- 3-2-1 countdown with gate sync before active play begins
- NPC ships are now present from phase 1 instead of waiting until phase 2
- 2-second invulnerability on run start with blinking visual indicator
- Arena simulation continues during countdown, death wipe, and result overlays
- Players can tap their menu callsign and choose the 2-letter prefix
- Callsign format: chosen 2 letters + persistent 3-digit suffix
- Existing saved callsigns migrate automatically to the new 2-letter/3-digit format
- Semi-live death/extraction result overlays (arena keeps moving in background)
- Slick/Regent death comms now pin in the center of the death result screen and stay visible until reset
- Death result actions now stay inside the framed result box, including `MENU`
- Death result label now reads `CREDITS LOST` to match the HUD language
- Ship destruction debris: all ships (player, NPC, enemy) break apart into fragments carrying inertia
- Death: immediate red wipe, player ship shatters, fragments drift with momentum
- Death results now show the actual credits lost instead of a generic label
- Death comms split by cause: Slick covers asteroid crashes, Regent taunts enemy/laser kills
- Salvage is now a pure floating scoring zone; player and NPCs can fly through it freely
- Salvage scoring is flat across the whole salvage ring instead of proximity-based
- Only ringed asteroids can be mined; unringed red asteroids remain hazards only
- Mineable asteroids now appear less often, but keep the same red asteroid bodies
- Salvage shatter: depleted/expired salvage breaks apart with debris effect
- Shield drops inherit NPC velocity and drift realistically during gameplay
- Enemy ships always drop collectible bonus-point pickups when destroyed in the arena
- NPC hazard deaths sometimes drop collectible bonus-point pickups alongside existing shield logic during gameplay
- Bonus-point pickups drift and expire, but do not magnetize toward the player
- NPCs can target and collect shield drops and bonus collectibles during gameplay
- NPC-held shields absorb one hazard hit and can pop enemies/asteroids instead of killing the NPC immediately
- Proximity-based asteroid mining: 1 pts/sec at edge, up to 15 pts/sec danger-close
- Rare salvage still multiplies rewards inside the flat salvage scoring zone
- How-to-play instructions on menu screen
- Hologram visual style and in-world training-module framing
- Online leaderboard on menu screen with daily/weekly tabs (Supabase)
- Score submission on extraction only, fire-and-forget (works offline)
- Slick comms overlay: smaller top-center panel with slimmer footprint during gameplay
- Regent comms overlay: smaller top-center panel in the same slot as Slick during gameplay
- Slick speaks on run start, occasionally on gate open, and occasionally on gate close
- Regent announces first enemy arrival (phase 5+), beam activation (phase 7), and starts gate-close pressure lines from phase 3 onward
- Starfield drifts subtly downward for ambient motion
- Entry gate: player spawns inside a closing exit gate synced to countdown
- Health system: salvage (15s HP, rare 7.5s) and asteroids (10s*scale HP) deplete while collected
- Overlapping mining/salvage gain feedback reflects actual stacked score
- Depleted entities flash for 3s then shatter with debris effect
- Polygon-based hitboxes: collision uses actual geometry for asteroids and enemies
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
- Shield power-up spawns near salvage during gameplay only
- Enemy ships (phase 5+) steer toward player, smash through asteroids
- Beam hazards (phase 7+) fire 1-3 volleys with double red flash warning
- NPC ships navigate to salvage, deplete HP, and are killed by asteroids/enemies
- NPC bump: player can push NPCs away from salvage (impulse force, no kill)
- NPC death drops shields only when the drop would land fully inside the arena during gameplay
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
- Mineable asteroid share may still need playtest tuning if the field feels too stingy or too busy
- Menu NPC density may need playtest tuning if the title screen feels too crowded or too empty
- Save key changed to `ssmt_save` - existing best scores under old key are lost
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH in Git Bash
- Windows Firewall may block port 5173 for LAN phone testing
- Supabase `scores` table must be created manually (SQL in plan doc)
- Chunk size warning on build (1.45MB) - Phaser is large, not actionable without code splitting
- Game-facing title may still be too long; naming direction for Slick's business is not finalized
- Slick/Regent line frequency and shared-slot presentation may still need playtest tuning on mobile

## Next actions
1. Playtest flat salvage scoring feel on desktop and mobile
2. Playtest menu NPC density and phase-1 NPC pacing on desktop and mobile
3. Continue into audio and settings screen (phase 6 items)

## Active plan
docs/plans/2026-03-27 0020 Plan - Slick Character Voice.md

## How to verify
1. Run `npm.cmd run dev -- --host 0.0.0.0` or `npm.cmd run build`
2. Die and confirm the result card says `CREDITS LOST` instead of `SCORE LOST`
3. Confirm the death comm panel and both action options still fit cleanly inside the card
4. Confirm extraction still shows `SCORE: ...`
5. Confirm retry/menu actions still work normally

## Recent logs
- docs/log/2026-03-27 1456 Death Label Copy.md - Renamed the death result label from `SCORE LOST` to `CREDITS LOST`
- docs/log/2026-03-27 1455 Death Card Bounds.md - Kept death result actions inside the framed result box
- docs/log/2026-03-27 1452 Salvage Safe Zone.md - Removed salvage death collision and reverted salvage scoring to a flat zone
