# 2026-04-06 2246 Debug Phase Jump Menu

## TL;DR
- What changed: Added a `DEBUG PHASE` section to the pause menu with buttons for phases 1-10, plus debug hooks in the extraction and difficulty systems so the run can jump cleanly into any phase.
- Why: Boss testing was still too slow when phase 10 required several minutes of survival, so the project needed a repeatable in-game shortcut.
- What didn't work: A UI-only shortcut would have left gate timing, boss lifecycle, and music state out of sync, so the phase owners needed explicit debug setters instead.
- Next: Use the phase 10 jump repeatedly to tune shield pacing, debris density, and whether the boss should more strongly gate extraction.

---

## Full notes

- Added `debugSetPhase()` to `ExtractionSystem` so phase count, timer, and gate state can be reset coherently.
- Added `debugSetPhase()` to `DifficultySystem` so phase config, combat timers, boss state, and pending drops can be rebuilt cleanly for the target phase.
- Added `debugJumpToPhase()` in `GameScene` to:
  - clear the board without granting mission kill credit
  - remove countdown/entry-gate state
  - reset extraction + difficulty to the selected phase
  - respawn baseline salvage and resume gameplay immediately
- Added a compact `DEBUG PHASE` button grid to the pause menu for phases `1` through `10`.
- Verified with `npm.cmd run build`.
