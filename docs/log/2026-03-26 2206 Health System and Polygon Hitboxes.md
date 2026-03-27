# 2026-03-26 2206 Health System and Polygon Hitboxes

## TL;DR
- What changed: Entry gate spawn, health system for salvage/asteroids, polygon-based hitboxes, tiny player hitbox
- Why: User requested all four features — entry gate for immersion, health for resource exhaustion gameplay, polygon hitboxes for accuracy, tiny player hitbox for feel
- What didn't work: Nothing blocked
- Next: Playtesting to tune HP values, consider visual feedback for depleted entities

---

## Full notes

### Entry gate spawn
- ExitGate constructor now accepts an optional `fixedPosition` parameter
- GameScene creates an entry gate at the player's spawn position on game start
- Gate plays its normal 5-second closing animation, then cleans up
- Purely cosmetic — no gameplay effect

### Health system
- Salvage: 60s HP (rare: 30s). Depleted at 1 HP/sec while player is in salvage radius
- Asteroids: 30s × radiusScale HP. Depleted at 1 HP/sec while player is in mining zone
- When HP hits 0, entity enters "depleted" state: flashes for 3 seconds then is destroyed
- HP bar appears below entity when damaged (green→orange→red)
- Depleted entities stop granting points

### Polygon-based hitboxes
- New `src/game/utils/collision.ts` with `pointInPolygon()` ray-casting algorithm
- Added `getWorldVertices()` to DrifterHazard, SalvageDebris, and EnemyShip
- CollisionSystem now checks if player center point is inside entity polygons
- Removed circle hitbox indicator rings from all entities
- Beams still use axis-aligned distance checks (not polygons)

### Player hitbox shrink
- PLAYER_RADIUS reduced from 10 to 5 (only matters for beam collisions)
- Visual triangle uses fixed VISUAL_SIZE=8, decoupled from hitbox
- Center dot renders at player origin to show actual hitbox point
- Shield visual also uses VISUAL_SIZE for proper appearance
