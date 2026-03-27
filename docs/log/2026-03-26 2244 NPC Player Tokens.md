# 2026-03-26 2244 NPC Player Tokens

## TL;DR
- What changed: Added NPC "other player" ships that compete for salvage, interact with hazards, and drop shields on death
- Why: Make the arena feel alive with other actors competing for resources
- What didn't work: N/A — clean implementation
- Next: Playtest NPC behavior, tune spawn rates and bump force

---

## Full notes

### New entity: NPCShip
- Amber/yellow triangle ships, similar visual style to player but different color
- Spawn from off-screen edges starting at phase 2
- Navigate toward nearest non-depleted salvage debris using steering AI (turn rate limited)
- Deplete salvage HP at 1 HP/sec when within salvage radius (same rate as player)
- Show pulsing ring indicator while actively salvaging

### NPC interactions
- **Asteroids destroy NPCs** — circle-circle collision in DifficultySystem
- **Enemy ships destroy NPCs** — enemies hunt NPCs when closer than player (40% distance bias)
- **Player bumps NPCs** — push force (250px/s impulse) within 18px, no damage to either
- **Death drops shields** — only hazard kills (not offscreen despawns) spawn a ShieldPickup at death position

### Phase config
- NPCs enabled at phase 2
- Spawn rate: 15s base, decreasing 2s per phase (min 8s)
- Max concurrent: starts at 1, grows to 3 by later phases

### Files changed
- `src/game/entities/NPCShip.ts` — new entity
- `src/game/data/tuning.ts` — NPC constants
- `src/game/types.ts` — PhaseConfig NPC fields
- `src/game/data/phaseConfig.ts` — NPC phase scaling
- `src/game/systems/DifficultySystem.ts` — NPC spawning, collision, enemy targeting, cleanup
- `src/game/scenes/GameScene.ts` — salvage targeting, bump physics, shield drops
