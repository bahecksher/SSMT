# 2026-05-01 1310 Boss Asteroid Throttle 2x

## TL;DR
- What changed: Increased the boss ambient asteroid spawn interval multiplier from 1.65x to 2.0x.
- Why: Boss fights still felt too crowded.
- What didn't work: 1.65x was not enough relief.
- Next: Live-test boss fights again; if still crowded, consider also lowering boss-phase asteroid cap.

---

## Full notes
- Updated `BOSS_DRIFTER_SPAWN_RATE_MULT` in `src/game/data/tuning.ts`.
- `npm.cmd run build` passes.
