# 2026-05-01 1308 Boss Asteroid Spawn Throttle

## TL;DR
- What changed: Ambient asteroid spawn intervals now get a 1.65x multiplier while a boss is alive.
- Why: Boss fights were too chaotic with full phase-10 asteroid cadence layered on top of boss mechanics.
- What didn't work: No live tuning run was performed in-browser during this pass.
- Next: Play a few boss fights and adjust `BOSS_DRIFTER_SPAWN_RATE_MULT` if 1.65x is too gentle or too sparse.

---

## Full notes
- Added `BOSS_DRIFTER_SPAWN_RATE_MULT` in `src/game/data/tuning.ts`.
- Applied it only to the ambient drifter spawn timer when `DifficultySystem` has a live boss.
- Boss vent debris and boss shield-drifter spawns are unchanged.
- `npm.cmd run build` passes.
