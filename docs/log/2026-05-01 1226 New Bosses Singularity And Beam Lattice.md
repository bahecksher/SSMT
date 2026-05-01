# 2026-05-01 1226 New Bosses Singularity And Beam Lattice

## TL;DR
- What changed: Added two new Phase 10 bosses — `SingularityBoss` (gravity-well black-hole) and `BeamLatticeBoss` (rotating central pylon with sweep beams). Spawn weights now split 25/25/25/25 across Gunship / Hauler / Singularity / Lattice. `BossEntity` gains optional `getForceField` and `getSalvageMultiplier` hooks; `SalvageSystem` gains a `setBossYieldMult` channel.
- Why: Round out the campaign boss roster so each Phase 10 reach feels distinct. User asked for the bosses to be built first; tuning and naming come later.
- What didn't work: Drifters/enemies are not affected by the singularity gravity field — only the player is pulled/pushed. Adding force-on-entity propagation through `DifficultySystem.update` was out of scope for this pass.
- Next: Live-tune timings/forces and pick a non-placeholder name for the Singularity. Decide whether to extend gravity to drifters.

---

## Full notes

### Files added
- `src/game/entities/SingularityBoss.ts`
- `src/game/entities/BeamLatticeBoss.ts`
- `docs/log/2026-05-01 1226 New Bosses Singularity And Beam Lattice.md`

### Files changed
- `src/game/data/tuning.ts` — split phase-10 boss spawn weights into 4×0.25; added `SINGULARITY_*` and `BEAM_LATTICE_*` blocks.
- `src/game/entities/BossEntity.ts` — added `BossForceImpulse` type and optional `getForceField` / `getSalvageMultiplier` methods.
- `src/game/systems/DifficultySystem.ts` — boss spawn picks via cumulative-weight roll across 4 boss classes.
- `src/game/systems/SalvageSystem.ts` — added `bossYieldMult` channel and `setBossYieldMult`; multiplied into salvage and mining income.
- `src/game/scenes/GameScene.ts` — calls `applyBossForceToPlayer(delta)` before `player.update`, and `applyBossSalvageMultiplier()` before `salvageSystem.update`. Both helpers are no-ops when the active boss doesn't implement the optional hooks.
- `docs/state.md` — refocused on the new boss work; rolled prior session into Recent logs.

### Singularity design
States cycle: `entry` → `warning` → `pull` → `repulse` → `vulnerable` → back to `warning` (until all hardpoints destroyed). Body radius is lethal only during `pull` (uses `checkBeamHit` so it routes through the existing player-shield-break path). Hardpoints (4 orbiting cores) are only collidable during `vulnerable`. Once all 4 are gone, the standard core-exposed → core-breach pattern triggers a kill.

Force field:
- During `pull`, returns inward acceleration with a falloff that grows as the player nears the core (caps at `SINGULARITY_PULL_RADIUS`).
- On entering `repulse`, a single one-shot outward impulse fires (velocity bump, not sustained acceleration). The `repulseImpulseUsed` flag resets at every state transition.

Visuals:
- Pulse rings contracting toward the core during warning/pull.
- Bright shock ring expanding during repulse.
- Tether lines from body to alive hardpoints during `vulnerable` to make the ram targets read.

### Beam Lattice design
Stationary at arena center after a brief drift-in. Continuously rotates at `BEAM_LATTICE_ROTATION_SPEED`. Four straight beams emanate from body perimeter; `checkBeamHit` is a point-to-segment distance test against each alive beam. Hardpoints sit at the body perimeter just outside the body radius so the player must dart between sweeping beams to ram one.

Salvage multiplier: `getSalvageMultiplier(x, y)` returns `BEAM_LATTICE_SALVAGE_MULTIPLIER` (2.5) when the player is within the inner/outer danger ring AND at least one beam is still alive. `GameScene.applyBossSalvageMultiplier()` reads the multiplier per frame and pushes it into `SalvageSystem.setBossYieldMult`. The danger ring is drawn as a faint salvage-colored set of two concentric circles for a visual cue.

Once all 4 beams are destroyed, falls into the standard core-exposed/breach flow.

### Why the optional interface methods
Existing bosses (Gunship, Slag Hauler) don't need force or multiplier behavior. Marking the methods optional avoided no-op overrides in those classes and kept the diff minimal. `GameScene` checks `boss?.getForceField` / `boss?.getSalvageMultiplier` before calling.

### Out of scope
- Drifter/enemy gravity reaction during Singularity pull.
- Regent / Slick dialogue lines specific to the new bosses (they reuse the generic ones).
- Versus-mode mirror rendering for new bosses (versus already does not mirror gunship/hauler — same applies).
- Dialogue for "Singularity" being a placeholder name.

### Risks
- Force field is applied to the player via `applyImpulse`; player.update lerps velocity toward swipe target, so gravity is partially counteracted by active swiping. This is intentional (the player should be able to fight the pull) but tuning will need a feel pass.
- Beam Lattice continuous beams are stronger than gunship's stagger-fire pattern. May feel oppressive without a cooldown — re-evaluate after a play test.
- Spawn split of 0.25 each is uniform; if any boss is much weaker/stronger than the others, expect uneven phase-10 difficulty until weights are tuned.
