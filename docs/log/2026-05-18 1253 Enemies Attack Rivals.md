# 2026-05-18 1253 Enemies Attack Rivals

## TL;DR
- What changed: Enemy ships can now target and collide with active rivals.
- Why: Rivals should feel like part of the arena ecosystem, not isolated only-player threats.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether enemies attack Redline often enough without making the rival too fragile.

---

## Full notes

Behavior changes:
- Enemy ships now consider active, non-fleeing rivals as secondary targets along with NPC ships.
- Enemies still prefer the player unless the secondary target is meaningfully closer, preserving the existing behavior shape.
- Enemy-rival collision destroys the enemy and damages the rival by 1 HP.
- Rival damage from enemy collision spawns `ShipDebris`, matching the player shield-hit feedback.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
