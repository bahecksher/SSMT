# 2026-03-27 2224 Board Wipe and Debug Menu

## TL;DR
- What changed: Enhanced bomb flash to full-white with 150ms hold + 600ms fade-out. Extracted `clearBoard()` and `boardWipe()` methods. Board wipe now fires on bomb detonation, game start (countdown "GO"), and extraction. Added a "DEBUG SPAWN" section to the pause menu with 8 spawn buttons.
- Why: Bomb effect wasn't visually impactful enough; user wanted the same clear+flash on game start and extraction. Debug menu needed for playtesting entity spawning.
- What didn't work: Nothing — straightforward additions.
- Next: Playtest board wipe feel and debug spawner across devices.

---

## Full notes

### Board wipe effect
- `Overlays.bombFlash` now uses alpha 1.0 (was 0.85), holds for 150ms, then fades over 600ms (was 450ms instant fade). More dramatic reveal.
- New `clearBoard()` method on GameScene centralizes entity clearing: drifters, beams, enemies, NPCs, shields, bonus pickups, bomb pickups, and salvage debris.
- New `boardWipe()` calls `clearBoard()` + `bombFlash()` + schedules salvage respawn after 800ms.
- `detonateBomb()` now delegates to `boardWipe()`.
- Countdown end ("GO") now calls `boardWipe()` instead of just `bombFlash()` — clears all entities carried over from menu handoff.
- `handleExtraction()` now calls `clearBoard()` before the flash + screen wipe.

### Debug spawn menu
- Added to pause menu below the settings section. Panel height increased to 84% of screen.
- 8 buttons in a 2-column grid: SHIELD, POINTS, BOMB, SALVAGE, RARE SALVAGE, ASTEROID SM, ASTEROID LG, MINEABLE AST.
- Each spawns the entity near arena center with a small random offset (±60px for most, ±40px for salvage/asteroids).
- Asteroids use `DrifterHazard.createFragment` with slow velocity (30px/s random direction).
- Bonus spawns with 0 collection delay for immediate testing.
