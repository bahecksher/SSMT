# 2026-03-25 2328 Gameplay Feel and Difficulty

## TL;DR
- What changed: 4 gameplay improvements — responsive controls, asteroid scaling/sizing, edge-drift salvage, scoring feedback + rare salvage
- Why: User feedback — controls felt stiff, game wasn't hard enough by phase 3-4, salvage popped in unnaturally, no scoring feedback
- What didn't work: N/A (fresh implementation)
- Next: Playtest and tune values, then Phase 6

---

## Full notes

### Controls overhaul
- Replaced fixed lerp (0.12) with distance-proportional velocity system
- `PLAYER_DISTANCE_SCALE = 3.5` maps touch distance to desired speed
- Max speed raised 400→600, follow speed 0.12→0.25
- 8px dead zone prevents jitter when finger is on top of player
- Deceleration on release: 0.88 friction factor

### Asteroid difficulty scaling
- `maxConcurrentDrifters` now uses `3 + phase*2 + phase^1.6` — roughly 4/7/12/18/25 per phase
- Size pools vary by phase: phase 1 = all normal (1x), phase 4+ = mix of 0.6x to 2.2x radius
- Larger asteroids move slower by `1/sqrt(scale)` factor
- CollisionSystem now reads per-drifter `radius` property instead of global constant

### Salvage edge-drift
- SalvageDebris now spawns from random screen edge, aimed at arena interior
- Drifts through arena and exits other side (same despawn + respawn logic)
- No more random interior pop-in

### Scoring indicator + rare salvage
- SalvageSystem now manages a list of debris, spawns floating "+N" text every 500ms while in range
- Rare salvage (purple): `isRare=true`, `radiusScale=0.6`, `pointsMultiplier = 2 + phase*0.5`, 10s lifetime
- Rare blinks in last 3s (faster blink in last 1.5s)
- Spawns every ~15s in phase 2+, interval decreases with phase (min 8s)
- SalvageSystem constructor now takes `scene` parameter for floating text creation

### Files changed
- src/game/data/tuning.ts — new player constants
- src/game/entities/Player.ts — distance-proportional movement
- src/game/entities/DrifterHazard.ts — per-instance radius
- src/game/entities/SalvageDebris.ts — edge spawn, rare config, lifetime/blink
- src/game/data/phaseConfig.ts — aggressive scaling, size pools, pickAsteroidSize()
- src/game/systems/DifficultySystem.ts — uses pickAsteroidSize, speed adjustment
- src/game/systems/CollisionSystem.ts — per-drifter radius
- src/game/systems/SalvageSystem.ts — multi-debris, floating score text
- src/game/scenes/GameScene.ts — multi-debris management, rare salvage spawning
