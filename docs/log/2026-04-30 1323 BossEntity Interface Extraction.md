# 2026-04-30 1323 BossEntity Interface Extraction

## TL;DR
- What changed: extracted a `BossEntity` interface so a second boss class can plug into `DifficultySystem` and `GameScene` without those callers knowing the concrete type. `GunshipBoss` now `implements BossEntity`. Method names on the boss surface that baked in gunship semantics were generalised: `destroyGun` → `destroyHardpoint`, `getCollidingGunIndex` → `getCollidingHardpointIndex`, `consumeBeamWarningPulse` → `consumeWarningPulse`. Edge-specific death-debris math moved off `DifficultySystem` and onto a new `getDestructionPlan()` method on the boss, which returns `{ center, inward, tangent }` so a non-edge boss (e.g. the planned Slag Hauler) can compute its own fan direction.
- Why: prep step for the new boss plan (`docs/plans/2026-04-30 1240 Plan - New Boss and Wormhole Pocket.md`). Phase-10 currently hardcodes `new GunshipBoss(...)`; this refactor makes the field type, getter, and call sites all behave identically for any future implementation.
- What didn't work: nothing — the interface surface mapped cleanly to existing call sites, and there were only two external callers (`GameScene`, `DifficultySystem`).
- Next: add Slag Hauler entity (Part 1 Option 1 of the plan) implementing `BossEntity`, plus a phase-10 spawn switch in `DifficultySystem.spawnBoss()` that picks gunship or hauler.

---

## Full notes

### Files changed
- `src/game/entities/BossEntity.ts` — new file. Defines `BossEntity` interface, `BossDropData`, and `BossDestructionPlan`.
- `src/game/entities/GunshipBoss.ts`:
  - `implements BossEntity`.
  - Drops the local `GunshipDropData` export in favor of `BossDropData` from `BossEntity.ts`.
  - Renamed `consumeBeamWarningPulse()` → `consumeWarningPulse()`.
  - Renamed `getCollidingGunIndex()` → `getCollidingHardpointIndex()`.
  - Renamed `destroyGun()` → `destroyHardpoint()`.
  - Removed the public `getEdge()` accessor and added `getDestructionPlan()` that bundles center + inward + tangent vectors. The `edge` field stays as a private detail.
- `src/game/systems/DifficultySystem.ts`:
  - Imports `BossEntity` (kept the concrete `GunshipBoss` import — still needed in `spawnBoss()` for now).
  - `private boss: BossEntity | null` and `getBoss(): BossEntity | null`.
  - `getBossGunCollisionIndex` → `getBossHardpointCollisionIndex`, `destroyBossGun` → `destroyBossHardpoint`, both delegating to the new interface method names.
  - `consumeWarningPulse()` is checked instead of `consumeBeamWarningPulse()`.
  - `handleBossDestroyed()` no longer reads the boss edge directly; it pulls `{ center, inward, tangent }` from `boss.getDestructionPlan()` and reuses the vectors as before.
- `src/game/scenes/GameScene.ts`:
  - Local var `bossGunIndex` → `bossHardpointIndex`, calls go through the renamed `getBossHardpointCollisionIndex` / `destroyBossHardpoint`.
  - All other boss-related code (`getCenter()`, `clearBoss()`, status text, mission lines) was already generic and untouched.

### Why this design
- `BossEntity` keeps the same shape `DifficultySystem` already used, just with neutral nouns. No new state machine or lifecycle wrapper. The minimum thing to make a second boss possible.
- `getDestructionPlan()` is the only behavioral change for the gunship. The vectors it returns produce the same debris fan as before, verified by re-reading the original `handleBossDestroyed()` math.
- Names like `hardpoint` and `warning pulse` work for the hauler and the beam lattice options too, so no second rename is expected when those land.

### Verification
1. `npm.cmd run build` — passes.
2. `Grep` over `src/` confirms no callers still reference the old method names or `GunshipDropData`.
3. Live two-window play test still pending — the change is type-level + light renames, no runtime behavior change for the gunship is expected.

### Out of scope (intentionally not touched)
- The Slag Hauler entity itself.
- `bossEnabled` config gate / `phase >= 10` rule — same as before.
- Versus mode mirroring of the boss — still not mirrored, same as the prior known issue.
