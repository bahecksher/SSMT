# 2026-04-30 1330 Slag Hauler Boss

## TL;DR
- What changed: added a second phase-10 boss, the Slag Hauler. Drifts in a straight line across arena center, has 4 destroyable segments (shield ram), continuously vents asteroid drifters out its flanks while alive, exposes a vulnerable core when all segments die, breached with the same shielded fly-through pattern as the gunship. Phase-10 spawn now picks gunship or hauler 50/50.
- Why: Part 1 of the active plan (`docs/plans/2026-04-30 1240 Plan - New Boss and Wormhole Pocket.md`). Adds replay variety to phase 10 and gives mining/asteroid mechanics a late-game stage.
- What didn't work: nothing — relied on the BossEntity interface from the prior session, so wiring was minimal.
- Next: live-test the hauler at phase 10 (use Shift+0). Tune segment count, vent cadence, and body speed once it's been through a real two-window pass. After that, start Part 2 (wormhole pocket).

---

## Full notes

### Files changed
- `src/game/entities/BossEntity.ts` — added `BossVentDrop` and a new interface method `consumeAsteroidVents(): BossVentDrop[]`. Vents are continuous asteroid spawn intents the host system collects each tick; gunship returns an empty array.
- `src/game/entities/GunshipBoss.ts` — implemented `consumeAsteroidVents()` returning `[]`. No behavior change for the gunship.
- `src/game/data/tuning.ts` — added `BOSS_SPAWN_WEIGHT_GUNSHIP` / `BOSS_SPAWN_WEIGHT_HAULER` and a `SLAG_HAULER_*` block (segment count, body speed, half-length, thickness, segment radius, core radii, vent interval/speed/size ranges, debris count).
- `src/game/entities/SlagHauler.ts` — new file. Implements `BossEntity`. Body drifts at constant velocity in a random heading; on leaving the arena (with overscan) it picks a fresh entry and re-enters. Segments are arranged in a line along the body axis; each has its own vent timer that pushes a `BossVentDrop` to a pending list. The vent fires at the next interval window, exits a random side of the body perpendicular to heading, and asks the host to spawn a `DrifterHazard` fragment with a random size and mineable flag. `getDestructionPlan()` returns the body axis as the tangent and the perpendicular as the inward vector so the existing death-fan code spreads debris naturally around the hauler.
- `src/game/systems/DifficultySystem.ts`:
  - Imported `SlagHauler` and `BOSS_SPAWN_WEIGHT_GUNSHIP`.
  - `spawnBoss()` rolls between `GunshipBoss` and `SlagHauler`.
  - `update()` now drains `boss.consumeAsteroidVents()` after the boss tick and pushes new `DrifterHazard` fragments via `DrifterHazard.createFragment`. The cap is `scaledMaxDrifters + 8` (matches the asteroid-collision fragment overflow allowance).

### Why this design
- The hauler reuses the same `destroyHardpoint` / `getCollidingHardpointIndex` / core-breach methods the gunship uses, so `GameScene` and `DifficultySystem` did not need any new branches. The only non-shared concept (continuous asteroid vents) lives behind one new interface method that the gunship implements as a no-op.
- Vent asteroids reuse the existing `DrifterHazard` fragment path, so they participate in the existing collision / mining / shield-ram / beam-clearing systems with no new code.
- 50/50 spawn weight keeps both encounters in rotation. The weights live in `tuning.ts` so they're easy to bias later if one boss feels stronger.

### Known shortcomings to revisit after live test
- Vent cadence (1.4–2.4s) and vent speed (90–180 px/s) are first-pass guesses. May feel either limp or oppressive once played.
- Body speed (38 px/s) is intentionally slow so segments are reachable; may need to climb if the hauler reads as a sitting duck.
- Hauler dialogue currently reuses the gunship's `bossEnter` / `bossCoreExposed` / `bossDestroyed` lines. Acceptable for now; could split keys later if the hauler should sound different.
- The hauler does not flash a beam-warning overlay (no beams). It does flag `consumeWarningPulse()` when a vent fires, which currently routes to `Overlays.beamWarningFlash`. That's intentional as a generic "warning" feedback channel, but if it feels noisy the vent flash can be dropped.
- Vent asteroids spawn just outside the body on the perpendicular axis — should never overlap the player at spawn, but if the player is hugging the body when a vent fires the asteroid will appear close. Acceptable as a "stay off the hull" tax.
- Versus mirror still does not render the boss; same prior known issue applies to the hauler.

### Verification
1. `npm.cmd run build` — passes.
2. Live test pending (`Shift+0` to jump to phase 10 a few times to confirm both bosses spawn).
3. Confirm hauler segments take shield rams, vents emit drifters out the flanks, core appears when all segments die, shielded fly-through breaches the core, debris fan plays.

### Out of scope (intentionally not touched)
- Wormhole pocket (Part 2 of the plan).
- Versus mirror rendering of either boss.
- New dialogue lines for the hauler.
- Mining-zone-style salvage points on hauler segments while alive — segments are currently just shield-ram targets, not mining nodes. The plan flagged this as a possible enhancement; deferred until the base encounter feels right.
