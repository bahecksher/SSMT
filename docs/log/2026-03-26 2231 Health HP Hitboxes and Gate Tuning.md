# 2026-03-26 2231 Health HP Hitboxes and Gate Tuning

## TL;DR
- What changed: Entry gate spawn, health system for salvage/asteroids, polygon hitboxes, tiny player hitbox, screen wipe transitions, exit gate grace period and pulsing
- Why: User requested gameplay improvements — resource exhaustion, accurate collision, entry/exit immersion, clearer death/extraction feedback
- What didn't work: Nothing blocked
- Next: Playtesting to validate HP values, gate timing, and hitbox feel

---

## Full notes

### Entry gate spawn
- ExitGate constructor accepts optional `fixedPosition` for placing at player spawn
- On game start, a gate appears at the player's position and closes over 5 seconds
- Purely cosmetic — player enters the arena through the gate

### Health system
- Salvage: 15s HP (rare: 7.5s). Depleted at 1 HP/sec while player is in salvage radius
- Asteroids: 10s × radiusScale HP. Depleted at 1 HP/sec while in mining zone
- HP bar appears below entity when damaged (green→orange→red)
- At 0 HP, entity enters depleted state: flashes for 3 seconds then destroyed
- Depleted entities stop granting points

### Polygon-based hitboxes
- New `src/game/utils/collision.ts` with `pointInPolygon()` ray-casting algorithm
- `getWorldVertices()` added to DrifterHazard, SalvageDebris, EnemyShip
- CollisionSystem checks player center point against entity polygons
- Circle hitbox indicators removed from all entities
- Beams still use axis-aligned distance checks

### Player hitbox
- PLAYER_RADIUS reduced from 10 to 5 (only matters for beam collisions)
- Visual triangle uses fixed VISUAL_SIZE=8, decoupled from hitbox
- Center dot renders at player origin to show actual hitbox point

### Screen wipe transitions
- Green wipe-down (0x44ff88, 50% alpha) on successful extraction
- Red wipe-down (0xff3366, 55% alpha) on death
- Both: 600ms cubic ease-in sweep, 400ms hold, then scene transition
- Replaced old static red overlay / inversion flash system
- Death freeze reduced from 1s to 250ms

### Exit gate tuning
- Visual radius kept at 50px, extraction hitbox shrunk to 20px
- Gate has 2s warmup (dimmed, not extractable), then 3s active window
- Pulsing animation when extractable: core, fill, diamond, and outer ring all pulse
- Extraction triggers immediately when player enters the active gate (no need to wait for close)

### HP tuning
- Salvage HP: 60s → 15s. Rare salvage: 30s → 7.5s
- Asteroid HP: 30s → 10s per radiusScale
- Resources deplete quickly — no more endless scoring on a single entity
