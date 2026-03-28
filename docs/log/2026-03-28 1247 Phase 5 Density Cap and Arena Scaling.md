# 2026-03-28 1247 Phase 5 Density Cap and Arena Scaling

## TL;DR
- What changed: Capped drifter count at 22 for phase 5+, plateaued spawn rate at phase 4 level, added arena density scaling so entity counts adapt to screen size, reduced ship debris fragments (5→3) and lifetime (1800→1000ms)
- Why: Phase 5 stacked beams + enemies + rising asteroid count, making screens (especially phones) unplayably cluttered. Smaller screens were also penalized with the same absolute entity count in less space, hurting scoring potential.
- What didn't work: N/A — straightforward tuning pass
- Next: Playtest phase 5+ density on phone vs desktop, verify equal feel and scoring opportunity

---

## Full notes

### Problem
Phase 5 introduced beams and enemies but also continued ramping asteroid count (28+) and spawn rate. On phones with smaller arenas, this created a wall of objects. Desktop players had more room to maneuver, giving them an inherent scoring advantage.

### Changes

**phaseConfig.ts**
- `maxConcurrentDrifters` capped at 22 for phase 5+ (was unbounded: 28, 36, 45...)
- `hazardSpawnRate` exponent clamped to phase 4 level (`Math.min(phase-1, 3)`) so rate doesn't shrink below ~253ms
- Speed and size multipliers still scale up — fewer but deadlier asteroids

**layout.ts**
- Added `getArenaDensityScale()`: returns 0–1 ratio of current arena area to reference (540×960) arena area
- Reference area calculated from default layout with insets: 355,324 px²

**DifficultySystem.ts**
- `scaledMaxDrifters` = `max(6, round(config.maxConcurrentDrifters * densityScale))`
- Applied to spawn gating and collision-split limit
- Recalculated on every `setPhase()` call

**ShipDebris.ts**
- Fragment count: 5 → 3
- Fragment lifetime: 1800ms → 1000ms
- Still visually reads as destruction, clears faster

### Design rationale
Difficulty at phase 5+ shifts from "dodge a swarm" to "dodge fewer but deadlier things." Beams and enemies are the new primary threats; asteroid density stays roughly at phase 4 levels. Arena density scaling ensures a phone player at 48% arena size faces ~48% the drifters — same density per pixel, same scoring opportunity.
