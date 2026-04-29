# 2026-04-29 1641 Versus Laser Receiver-Side Arena Clear

## TL;DR
- What changed: sabotage laser strikes on the receiver now clear the local player, receiver-side asteroids, enemies, NPCs, and all powerup pickups in the struck lane instead of only checking the player.
- Why: the current known issue was that the strike felt underpowered and inconsistent because it left the rest of the receiver's lane untouched.
- What didn't work: no live two-window feel pass yet; this change is TypeScript/build verified only.
- Next: run a two-window match and judge whether the new lane clear feels strong/fair or needs tuning.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

Implemented in `src/game/scenes/GameScene.ts`:

- Expanded the incoming versus laser handling so lethal strikes now do two things on the receiver:
  - resolve player hit / shield break as before
  - directly clear local arena entities that intersect the lane
- Added a direct receiver-side clear helper instead of marking enemies/NPCs inactive and waiting for `DifficultySystem` cleanup.

Why direct clear instead of reusing inactive cleanup:

- `DifficultySystem` cleanup for dead enemies/NPCs spawns local drops.
- If the sabotage laser used that path, the receiver could end up with fresh bonus/bomb/laser/shield drops created by the strike itself, which would feel strange and undermine the disruption.
- The new helper removes the entities immediately and only spawns the visual `ShipDebris` breakup effect.

Entities now cleared by receiver-side strike:

- player
- `DrifterHazard`
- `EnemyShip`
- `NPCShip`
- `ShieldPickup`
- `BonusPickup`
- `BombPickup`
- `VersusLaserPickup`

Not changed:

- Salvage debris is still not cleared by the sabotage laser.
- No mission progress, rep-flux credit, or bonus drops are granted for strike-cleared receiver-side entities.

Files changed:

- `src/game/scenes/GameScene.ts`
- `docs/state.md`
- `docs/log/2026-04-29 1641 Versus Laser Receiver-Side Arena Clear.md`

Verification:

- `npm.cmd run build`
