# Plan - Ideas.md Implementation
_Created: 2026-03-26 0919_
_Status: Completed 2026-03-26 1420_

## Goal
Implement the visual polish and gameplay features from `docs/Ideas.md`: spinning randomized shapes, death freeze+inversion, enemy ships, beam phase adjustment, and hologram visual overhaul. Multiplayer and Campaign deferred.

## Implementation Order (all completed)

### Phase A: Spinning + Randomized Shapes (Salvage & Asteroids)
- Drifters: 5-8 random vertices, spin 0.2-0.6 rad/s
- Salvage: 6-10 random vertices, spin 0.3-0.8 rad/s
- Manual vertex rotation via rotatePoint() helper each frame
- Collision stays circle-based

### Laser Config Change
- Beams moved from phase 3 to phase 5

### Phase B: Death Effects (Freeze + Color Inversion)
- Added DEATH_FREEZE game state with 1s timer
- After freeze: 2x inversion flash (250ms inverted, 150ms gap)
- Entities have `inverted` boolean for color swap in draw()

### Phase C: Enemy Ships
- New EnemyShip entity: arrow/wedge shape, magenta, steering AI
- Speed 120px/s, turn rate 2 rad/s, radius 12px
- Spawns from edges after phase 2, scaling: 1-4 max concurrent
- Smashes through asteroids (reuses shieldDestroyDrifter)
- Shield absorbs enemy hit and destroys enemy

### Phase D: Hologram Visual Overhaul
- All entities: strokePath() + low alpha fillPath() instead of just fillPath()
- Hologram palette: cyan-green base, red for hazards
- Scanline overlay (3px intervals), per-entity 3% flicker
- Arena grid (40px intervals), green-tinted starfield
- Background color: #020a08

## Decisions Made
- Beams move to phase 5 — enemies fill the phase 2-4 threat gap
- Hologram style: cyan-green + red for danger
- Randomized shapes visual only; collision remains circle-based
