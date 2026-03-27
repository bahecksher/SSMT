# 2026-03-26 0919 Ideas Implementation

## TL;DR
- What changed: Implemented all 6 items from Ideas.md (randomized shapes, spinning, death effects, enemy ships, beam rebalance, hologram visuals)
- Why: Player requested visual polish and gameplay expansion per Ideas.md
- What didn't work: Nothing major — all phases built cleanly
- Next: Playtest and tune values (enemy speed/turn rate, flicker intensity, hologram alphas); consider audio, settings screen, multiplayer/campaign

---

## Full notes

### Phase A: Spinning + Randomized Shapes
- DrifterHazard now generates 5-8 random vertices at 0.7-1.0x radius from center
- SalvageDebris generates 6-10 vertices at 0.6-1.0x radius, plus 2-3 inner detail lines
- Both spin at randomized speeds with random direction
- Fragment creation (DrifterHazard.createFragment) also gets unique random shapes
- Collision radii unchanged (still circle-based)

### Laser Config
- beamEnabled changed from `phase >= 3` to `phase >= 5`
- beamFrequency formula adjusted accordingly

### Phase B: Death Effects
- New DEATH_FREEZE game state added to types.ts
- handleDeath sets 1s freeze timer; update loop skips entity updates during freeze
- After freeze, Overlays.deathInversionSequence flashes 2x with red overlay + inverted entity colors
- Added `inverted` boolean to Player, DrifterHazard, SalvageDebris, EnemyShip

### Phase C: Enemy Ships
- New EnemyShip entity: arrow/wedge shape, magenta, steering AI toward player
- Integrated into DifficultySystem (spawn timer, update, cleanup)
- Enemy-drifter collisions: enemies smash through asteroids using shieldDestroyDrifter
- CollisionSystem.checkEnemies added for player-enemy collision
- GameScene integrates enemy collision alongside existing checks; shield destroys enemy
- PhaseConfig extended with enemyEnabled, enemySpawnRate, maxConcurrentEnemies

### Phase D: Hologram Visual Overhaul
- All entities converted from fillPath to strokePath + very low alpha fill
- Color palette: SALVAGE changed to green (0x00ff88), HUD to cyan (0x00ffcc), BG to dark green-black
- Per-entity 3% random flicker (alpha drops to 0.4)
- HologramOverlay.ts: scanlines every 3px at 8% opacity with alpha flicker
- Arena grid: subtle lines every 40px inside play area
- Starfield tinted 60% green, dimmer stars
- Background color #020a08

### Files created
- src/game/entities/EnemyShip.ts
- src/game/ui/HologramOverlay.ts

### Files modified
- src/game/entities/DrifterHazard.ts (random shapes, spin, inverted, hologram)
- src/game/entities/SalvageDebris.ts (random shapes, spin, inverted, hologram)
- src/game/entities/Player.ts (inverted, hologram stroke rendering)
- src/game/entities/BeamHazard.ts (unchanged - already stroke-based, colors kept for hazard)
- src/game/entities/ShieldPickup.ts (hologram stroke rendering)
- src/game/entities/ExitGate.ts (hologram stroke rendering)
- src/game/scenes/GameScene.ts (death freeze, enemy integration, hologram overlay, arena grid)
- src/game/systems/DifficultySystem.ts (enemy spawn/update/collision)
- src/game/systems/CollisionSystem.ts (checkEnemies)
- src/game/data/phaseConfig.ts (beam phase 5, enemy config)
- src/game/data/tuning.ts (enemy constants)
- src/game/types.ts (DEATH_FREEZE state, PhaseConfig enemy fields)
- src/game/constants.ts (hologram color palette, GRID color)
- src/game/config.ts (background color)
- src/game/ui/Overlays.ts (deathInversionSequence)
