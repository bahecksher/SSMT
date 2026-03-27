# 2026-03-26 0054 Session Close - Gameplay Overhaul

## TL;DR
- What changed: Full gameplay overhaul across three rounds of work — controls, difficulty, scoring, arena, collisions, shield
- Why: User playtested and iterated on feel, difficulty, and mechanics across the session
- What didn't work: N/A
- Next: Playtest on mobile, tune values, then Phase 6 (audio, settings, polish)

---

## Full notes

This session covered three rounds of changes based on user feedback:

### Round 1: Gameplay feel (2026-03-25 2328)
- Replaced stiff lerp controls with distance-proportional velocity (flick=fast, close=slow)
- Asteroid sizes vary per phase via weighted size pools
- Salvage drifts in from screen edge instead of popping in
- Floating "+N" score text when inside salvage radius
- Rare salvage (purple, phase 2+): smaller radius, higher multiplier, 10s lifetime with blink

### Round 2: More asteroids + new scoring mechanics
- Cranked asteroid counts: spawn rate 2000ms→600ms, max concurrent 12→65 by phase 5
- Size pools scaled up: phase 1 gets 1-2x, phase 5 gets up to 6x radius boulders
- Asteroid proximity mining: +1/sec per asteroid when inside mining radius (3.5x body radius)
- Salvage debris is now lethal on direct body contact (18px kill radius)
- Overlapping salvage and mining zones stack scoring correctly (removed single-debris break)

### Round 3: Arena, collision physics, shield (2026-03-26 0048)
- Arena boundary: 60px inset from screen edges, visible border with corner markers
- Player clamped to arena, threats spawn from screen edges (visible approach)
- Asteroid-asteroid elastic collision with mass-proportional bounce
- Large asteroids split into two 55%-scale fragments on collision
- Shield power-up: blue hexagon spawns near salvage, absorbs one lethal hit
- HUD shows SHIELD status, blue flash on shield break

### Key tuning values (current)
- PLAYER_FOLLOW_SPEED: 0.25, MAX_SPEED: 600, DISTANCE_SCALE: 3.5
- DRIFTER_SPAWN_RATE_BASE: 600ms, SPEED_BASE: 110
- DIFFICULTY_SPEED_SCALE: 0.18, SPAWN_SCALE: 0.75
- ARENA_INSET: 60px
- SALVAGE_KILL_RADIUS: 18, DRIFTER_MINING_RADIUS_MULT: 3.5
- MIN_SPLIT_SCALE: 0.6, split child scale: 0.55x parent

### All files touched this session
- src/game/constants.ts
- src/game/data/tuning.ts
- src/game/data/phaseConfig.ts
- src/game/entities/Player.ts
- src/game/entities/DrifterHazard.ts
- src/game/entities/SalvageDebris.ts
- src/game/entities/ExitGate.ts
- src/game/entities/ShieldPickup.ts (NEW)
- src/game/systems/InputSystem.ts (unchanged)
- src/game/systems/SalvageSystem.ts
- src/game/systems/CollisionSystem.ts
- src/game/systems/DifficultySystem.ts
- src/game/scenes/GameScene.ts
- src/game/ui/Hud.ts
- src/game/ui/Overlays.ts
- src/game/types.ts (unchanged)
