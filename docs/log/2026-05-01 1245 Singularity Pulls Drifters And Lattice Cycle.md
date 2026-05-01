# 2026-05-01 1245 Singularity Pulls Drifters And Lattice Cycle

## TL;DR
- What changed: Singularity gravity field now applies to all drifters in addition to the player. Beam Lattice gained a 5s fire / 15s cooldown cycle with a ~1.1s charge telegraph; salvage multiplier and beam lethality are gated on the fire window.
- Why: Per user — "all drifters need to be pulled in too" and "let's do a 5 second fire, 15 second cool down".
- What didn't work: Original Singularity repulse used a one-shot `ix/iy` impulse with a `repulseImpulseUsed` latch. That latch fired once per state transition globally, so applying the force per-drifter would have only pushed the first drifter encountered each frame. Refactored repulse to sustained outward acceleration over the 700ms repulse window — same total energy, no per-target gating needed.
- Next: Live-tune fire/cooldown timings, charge telegraph length, and pull/repulse strengths. Confirm asteroids being consumed during PULL feels right.

---

## Full notes

### Files changed
- `src/game/data/tuning.ts`
  - Removed `SINGULARITY_REPULSE_IMPULSE`; added `SINGULARITY_REPULSE_ACCEL = 1100` (px/s² over the repulse window).
  - Added `BEAM_LATTICE_FIRE_MS = 5000`, `BEAM_LATTICE_COOLDOWN_MS = 15000`, `BEAM_LATTICE_CHARGE_TELEGRAPH_MS = 1100`.
- `src/game/entities/SingularityBoss.ts` — repulse state returns sustained outward `ax/ay` instead of one-shot impulse; dropped `repulseImpulseUsed` latch.
- `src/game/entities/BeamLatticeBoss.ts` — added `cycleState: 'cooldown' | 'fire'` plus `cycleMs`, `advanceCycle`, telegraph rendering. `checkBeamHit`, `getSalvageMultiplier`, beam draw, danger ring all gated on fire window. Telegraph (last `BEAM_LATTICE_CHARGE_TELEGRAPH_MS` of cooldown) draws thin flickering lines that grow toward beam length but are not lethal. Fire window flashes overlay via `consumeWarningPulse` (used to be a no-op for this boss). `getStatusLabel` now reports FIRING / CHARGING / COOLDOWN. `getStatusColor` flips to ENEMY during fire and during the telegraph slice.
- `src/game/systems/DifficultySystem.ts` — added `applyBossForceToDrifters(delta)` invoked just before `drifter.update`. Reuses the same `getForceField` interface used for the player. No-op for Gunship/Hauler (no force field) and during ENTRY/WARNING/VULNERABLE singularity states.
- `docs/state.md` — refreshed.

### Behavior notes
- Drifters during SINGULARITY PULL: accelerated inward; once they touch the singularity body, the existing `resolveBossBeamEntityCollisions` path destroys them via `boss.checkBeamHit` (true within body radius during PULL). Mining points still credit during the slow approach.
- Drifters during SINGULARITY REPULSE: pushed outward by sustained acceleration. They will keep their post-repulse velocity until the next state cycle or arena collision logic kicks in. May run into the existing arena-edge bounce caps; if asteroids start escaping or accumulating, revisit.
- BEAM LATTICE during cooldown: beams not drawn, not lethal, salvage multiplier off. Body still rotates to keep visual continuity. During the last ~1.1s of cooldown, telegraph lines flicker outward as a heads-up.
- The salvage multiplier is intentionally fire-only: forces the player to risk being inside the danger ring exactly when beams are sweeping.

### Risks
- `SINGULARITY_REPULSE_ACCEL = 1100` is a guess. With a 700ms window and falloff between 0.55–1.40×, peak velocity gain ~1500 px/s near the core. May overshoot and feel chaotic; tune after a play session.
- The 5s/15s cycle gives the player long farming windows in the danger ring. If the multiplier is too generous the boss becomes a free salvage mine — may need to tighten the multiplier or shrink the window after a feel pass.
- Drifter pull during PULL state may starve the surrounding arena of asteroids if the cycle runs long. Currently mitigated only by drifter respawn during boss phase; verify pacing.
