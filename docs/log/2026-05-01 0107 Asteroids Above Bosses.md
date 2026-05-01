# 2026-05-01 0107 Asteroids Above Bosses

## TL;DR
- What changed: Raised asteroid graphics above boss bodies.
- Why: Asteroids were rendering behind bosses, making overlaps read incorrectly.
- What didn't work: No live boss/asteroid visual pass was run in this session; only build verification.
- Next: Use `Shift+0` and boss vent/asteroid overlap to confirm rocks stay visible above boss bodies without hiding the player.

---

## Full notes

- Changed `DrifterHazard` graphics depth from `5` to `12`.
- Applied the same depth to spawned asteroid fragments from `DrifterHazard.createFragment()`.
- Player remains above asteroids at depth `20`.
- Boss graphics remain at depth `6`.
- Build verification passed with `npm.cmd run build`.
