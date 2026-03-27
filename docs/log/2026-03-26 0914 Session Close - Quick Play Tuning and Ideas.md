# 2026-03-26 0914 Session Close - Quick Play Tuning and Ideas

## TL;DR
- What changed: Gate extraction now requires being present at close; shield drifts with salvage and destroys/splits asteroids; beam volleys (1-3) with double red flash warning; starfield background; HUD "SALVAGE" → "CREDITS"; asteroid speed reduced (110→70); vite LAN access fixed; mode named "Quick Play"; ideas doc updated
- Why: Gameplay feel improvements, mobile access fix, and future planning
- What didn't work: Nothing — all changes compiled and ran cleanly
- Next: Playtest on mobile, implement ideas from Ideas.md (spinning/random shapes, death freeze+invert, enemy ships, hologram visuals), Phase 6 (audio, settings, polish)

---

## Full notes

### Changes this session (across multiple sub-sessions)

**Extraction timing (gate close)**
- Extraction only triggers if player is inside the gate radius at the frame the gate disappears
- ExtractionSystem tracks a one-frame `closingGate` reference; BankingSystem checks it
- Makes extraction a commitment/timing skill

**Shield improvements**
- Shield pickup now drifts alongside its paired salvage debris (velocity copied at spawn)
- On hit, shield destroys the colliding asteroid — large ones split into two fragments, small ones vaporize
- CollisionSystem.checkDrifters returns the hit DrifterHazard (was boolean); DifficultySystem.shieldDestroyDrifter() handles split logic

**Beam volley overhaul**
- DifficultySystem spawns 1-3 beams per volley (simulating ship broadside)
- Overlays.beamWarningFlash fires two sequential red screen flashes before beams appear

**Visual / UI**
- Starfield background: 120 random stars at depth -1 behind everything
- HUD label changed from "SALVAGE:" to "CREDITS:"

**Tuning**
- Asteroid base speed reduced from 110 to 70

**Infrastructure**
- vite.config.ts: added `server: { host: true }` for LAN/mobile access

**Naming / decisions**
- Current game loop designated "Quick Play" mode
- "Credits" chosen over "Salvage" for score label
- Both recorded in decisions.md

**Ideas doc updated**
- Added: salvage spinning/random shapes, lasers at phase 5, hologram visual direction
- Merged with existing multiplayer and campaign ideas
