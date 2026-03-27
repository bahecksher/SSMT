# 2026-03-26 0048 Arena Collision Shield

## TL;DR
- What changed: Arena boundary inset, asteroid-asteroid collision with splitting, shield power-up
- Why: User wanted to see threats spawn in, asteroids to interact with each other, and a defensive option
- What didn't work: N/A (fresh implementation)
- Next: Playtest and tune values

---

## Full notes

### Arena boundary
- Added ARENA_INSET = 60px in constants.ts, creating ARENA_LEFT/TOP/RIGHT/BOTTOM/WIDTH/HEIGHT
- Player clamped to arena bounds, not screen edges
- Visible boundary: subtle rectangle with corner markers
- ExitGate spawns inside arena bounds
- Threats (drifters, salvage, beams) still spawn from screen edges — visible before entering arena

### Asteroid collision + splitting
- DrifterHazard now exposes vx/vy and radiusScale publicly
- Added DrifterHazard.createFragment() static factory for spawning fragments at specific positions
- DifficultySystem.resolveDrifterCollisions(): O(n^2) check each frame
  - Elastic bounce: mass proportional to radius^2, impulse resolution with separation
  - Splitting: when two asteroids collide and the larger is > MIN_SPLIT_SCALE*2, it splits into two fragments at 55% scale, scattered perpendicular to collision normal
  - Fragment cap: won't split if total count exceeds maxConcurrentDrifters + 8
- MIN_SPLIT_SCALE = 0.6 — fragments below this won't split further

### Shield power-up
- New entity: ShieldPickup (blue hexagon with pulsing ring)
- Spawns near salvage debris when player has no shield and no pickup exists
- Collected on contact (PLAYER_RADIUS + pickup radius)
- Player.hasShield flag — draws blue ring around player when active
- On collision while shielded: shield consumed, blue flash, player survives
- HUD shows "SHIELD" text when active

### Files changed
- src/game/constants.ts — arena boundary constants
- src/game/entities/Player.ts — arena clamping, shield state + visual
- src/game/entities/DrifterHazard.ts — public velocity, radiusScale, createFragment()
- src/game/entities/ExitGate.ts — use arena bounds
- src/game/entities/ShieldPickup.ts — NEW
- src/game/systems/DifficultySystem.ts — asteroid collision + splitting
- src/game/scenes/GameScene.ts — arena border drawing, shield pickup management, shield-absorb logic
- src/game/ui/Overlays.ts — shieldBreakFlash
- src/game/ui/Hud.ts — shield status display
