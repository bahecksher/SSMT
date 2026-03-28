# 2026-03-27 2308 Phase 6 Polish Salvage and Tuning

## TL;DR
- What changed: Board wipe now shatters all entities into debris. Salvage redesigned as modular rectangles (space station style). NPC shield-kills drop bonus pickups. Mining ring and salvage collection radius reduced. Extraction dialogue always fires. Flash fade slowed.
- Why: Bomb effect was too abrupt (entities vanished). Salvage looked too similar to asteroids and was too small. Mining ring was oversized. Extraction dialogue was RNG-gated at 55%.
- What didn't work: Nothing major.
- Next: Playtest new salvage size/shape, mining ring proximity, and board wipe feel.

---

## Full notes

### Board wipe shatter effect
- `clearBoard()` now spawns `ShipDebris` for every entity before destroying it — asteroids (red), enemies (magenta), NPCs (amber), shields (blue), bonus pickups (green), bomb pickups (orange), salvage (green/pink).
- `bombFlash` slowed: 200ms hold at full white, 1000ms fade-out (was 150ms/600ms).

### NPC bonus drops
- Player shield-killing an unshielded NPC now drops a `BonusPickup` worth `NPC_BONUS_POINTS` (70) with the standard 1.5s collection delay.

### Salvage redesign
- Shape changed from random polygon blobs to 2-3 layered perpendicular rectangles arranged edge-to-edge like space station modules.
- Visual size increased: normal 80px base radius (was 28), rare 45px (was 14). Clearly larger than the biggest asteroids.
- `SALVAGE_RADIUS` (collection ring) reduced from 120 to 80.
- Spin speed slowed to 0.15-0.45 rad/s for heavier feel.

### Mining ring tuning
- `DRIFTER_MINING_RADIUS_MULT` reduced from 3.5 to 1.8. Ring is now just under 2x the asteroid body.

### Extraction dialogue fix
- Changed from `tryShowSlick('extraction', 0.55)` (55% chance) to `showSlickExclusive` (always fires).
