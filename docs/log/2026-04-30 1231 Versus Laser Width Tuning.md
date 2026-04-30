# 2026-04-30 1231 Versus Laser Width Tuning

## TL;DR
- What changed: increased `VERSUS_LASER_WIDTH` from `26` to `36`.
- Why: sent/spectate sabotage lasers were reading a little too small and not threatening enough.
- What didn't work: no live two-window feel pass was run in this session.
- Next: verify the wider lanes feel dangerous without being unfair.

---

## Full notes

- Changed the shared versus laser width tuning value in `src/game/data/tuning.ts`.
- This feeds `VersusLaserStrike` and the mirrored laser echo width.
- `npm.cmd run build` passes.
