# 2026-05-01 0012 Wormhole Compact Tuning

## TL;DR
- What changed: Added screen-size-aware wormhole pocket tuning for compact phone layouts.
- Why: Wormhole space inherited the main density scaling, but its fixed speed/density multipliers still made phone-sized arenas nearly instant death.
- What didn't work: No live phone feel test was run in this session; only build verification.
- Next: Test on a phone-sized viewport and adjust compact/tiny speed first if the opening pocket seconds are still too lethal.

---

## Full notes

- Added compact and tiny wormhole tuning constants in `src/game/data/tuning.ts`.
- `DifficultySystem` now selects a pocket pressure profile from the current layout:
  - desktop/full-size keeps the original pocket values.
  - compact (`narrow || short`) uses lower cap, slower spawn pressure, lower asteroid speed, and a max pocket asteroid size of `3.2`.
  - tiny (`narrow && short`) uses stronger relief and a max pocket asteroid size of `2.2`.
- `pickPocketAsteroidSize()` now accepts an optional max size and filters the weighted pool while preserving the original pool as a fallback.
- Build verification passed with `npm.cmd run build`.
