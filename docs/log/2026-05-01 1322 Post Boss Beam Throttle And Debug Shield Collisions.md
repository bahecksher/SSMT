# 2026-05-01 1322 Post Boss Beam Throttle And Debug Shield Collisions

## TL;DR
- What changed: Post-boss beams now use a 3.0x frequency multiplier and single-beam bursts; debug invulnerability now runs hazard/boss collisions through shield-style handling.
- Why: The escape phase had too much laser pressure, and debug invulnerability made collision testing awkward by skipping collision effects.
- What didn't work: No live browser run was performed during this pass.
- Next: Verify post-boss escape after a boss kill and use debug invulnerability to ram asteroids, enemies, and boss hardpoints.

---

## Full notes
- Added `POST_BOSS_BEAM_FREQUENCY_MULT` and `POST_BOSS_BEAM_BURST_COUNT` in `src/game/data/tuning.ts`.
- `DifficultySystem.getActiveConfig()` now applies post-boss beam throttling while the post-boss surge is active.
- `GameScene` treats debug invulnerability as shield-present for boss core breach, hardpoint rams, and standard hazard collision effects, without consuming a real shield.
- `npm.cmd run build` passes.
