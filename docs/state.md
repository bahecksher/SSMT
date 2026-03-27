# State
_Last updated: 2026-03-27 0144_

## Current focus
Session closed. Players can now choose the 3-letter prefix of their callsign from the menu instead of always getting random letters. Semi-live death/extraction overlays, no-freeze death pacing, countdown styling/gate sync, starfield drift, overlap feedback fixes, and arena-safe NPC shield drops are in place. Ready for playtesting and deploy.

## What's working
- Full scene flow: Boot -> Menu -> Game
- Core salvage-risk loop is playable and readable
- Players can tap their menu callsign and choose the 3-letter prefix they want to use
- Callsign format remains arcade-style: chosen 3 letters + persistent 4-digit suffix
- Death and extraction now show in-scene semi-live result overlays instead of switching to a separate game-over scene
- During result overlays, the arena keeps updating in the background while player consequences remain frozen
- Death now transitions immediately into the red wipe with no dedicated hit freeze
- Death wipe timing is fast (`350ms` wipe, `120ms` hold) so the `DESTROYED` overlay appears quickly
- The arena now keeps moving during the death wipe itself instead of pausing
- On fatal impact, the player ship turns red instead of disappearing immediately
- Game start pauses player control on a large bold center-screen `3, 2, 1` countdown before active play begins
- Countdown styling matches the HUD/scoring hologram feel more closely, with each number growing across its own second and resetting for the next beat
- Arena simulation continues running during the countdown instead of freezing beneath it
- Entry gate at spawn closes on the same 3-second timing as the countdown
- Hologram visual style and in-world training-module framing are established
- Live phase-1 simulation behind menu screen (asteroids, salvage, hologram overlay)
- Seamless transition: menu background entities carry into gameplay
- Starfield behind the arena now drifts subtly downward for light ambient motion
- How-to-play instructions on menu screen
- Online leaderboard on menu screen with daily/weekly tabs (Supabase)
- Player identity: editable callsign initials + persistent 4-digit suffix
- Score submission on extraction only, fire-and-forget (works offline)
- Slick comms overlay: geometric AI face portrait, top-center, slides down from top
- Slick speaks on run start, gate open, and occasionally on gate close (50% chance)
- Entry gate: player spawns inside a closing exit gate on game start
- Health system: salvage (15s HP, rare 7.5s) and asteroids (10s*scale HP) deplete while collected
- Overlapping mining/salvage gain feedback now reflects the actual stacked score being earned
- Depleted entities flash for 3s then destroyed, with HP bar indicator
- Polygon-based hitboxes: collision uses actual geometry (point-in-polygon ray casting)
- Player hitbox is center point only (extremely small); PLAYER_RADIUS=5 for beams
- Screen wipe transitions: green wipe-down on extraction, red wipe-down on death
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
- NPC death drops shields only when the drop would land fully inside the play arena
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
- Slick portrait size and line frequency may need playtest tuning on mobile

## Next actions
1. Playtest editable callsigns, no-freeze death pacing, semi-live result overlays, and arena readability on desktop and mobile
2. Deploy latest build to GitHub Pages
3. Audio and settings screen (phase 6 items)

## Active plan
docs/plans/2026-03-27 0020 Plan - Slick Character Voice.md

## How to verify
1. Run `npm.cmd run dev -- --host 0.0.0.0` or deploy to GitHub Pages
2. On the menu, tap the pilot callsign and enter 3 letters
3. Confirm the menu updates to the new letters while preserving the 4-digit suffix
4. Extract a score and confirm the leaderboard submission uses the updated callsign
5. Run `npm.cmd run build`

## Recent logs
- docs/log/2026-03-27 0144 Editable Callsign Initials.md — Added menu editing for the 3-letter callsign prefix while keeping the 4-digit suffix
- docs/log/2026-03-27 0141 No-Freeze Death Wipe.md — Kept the arena moving during the death wipe and turned the player ship red on fatal impact
- docs/log/2026-03-27 0139 Faster Death Wipe.md — Accelerated the death wipe animation itself so destruction resolves more quickly
- docs/log/2026-03-27 0137 Remove Death Hit Freeze.md — Removed the dedicated death freeze so impact flows straight into the red wipe/result overlay
- docs/log/2026-03-27 0136 Shorter Death Hold.md — Shortened the death wipe post-hold so the result screen appears faster after impact
