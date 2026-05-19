# 2026-05-19 0215 Gameplay Bug Tuning

## TL;DR
- What changed: Fixed one-rival-per-run, centered the post-boss escape gate, eased wormhole pocket asteroid pressure, darkened the wormhole palette, and made the background ring scale up by phase.
- Why: The current playtest notes called out repeated rivals, misplaced final escape, overwhelming wormhole density, insufficient wormhole realm mood, and a desired descent-toward-the-ring phase read.
- What didn't work: First build attempt failed in the sandbox because Vite could not write `node_modules/.vite-temp`; rerunning with approved escalation passed.
- Next: Manually playtest the feel of wormhole density/darkness and the phase ring scaling curve.

---

## Full notes

Implemented the requested targeted fixes:

- Added a `rivalSpawnedThisRun` latch in `DifficultySystem`.
  - Natural rival spawning now stops after the first rival appears.
  - The debug rival shortcut also respects the latch and reports `DEBUG // RIVAL ALREADY SPAWNED`.
  - Entering a wormhole can still clear the active rival, but it will not allow a second rival later in the same run.

- Changed the post-boss forced escape gate to pass `{ x: layout.centerX, y: layout.centerY }` into `ExtractionSystem.forceGate(...)`.
  - This keeps the final escape circle centered in the arena after the boss defeat delay.

- Reduced wormhole pocket asteroid pressure in `tuning.ts`.
  - Full viewport cap multiplier: `4.5` -> `2.65`
  - Full viewport spawn-rate multiplier: `0.22` -> `0.46`
  - Full viewport speed multiplier: `2.25` -> `1.65`
  - Compact/tiny viewport cap, spawn, and speed multipliers were also eased.

- Darkened the pocket runtime palette.
  - Replaced the bright gold/brown pocket background with a darker purple/void base.
  - Kept player, gate, salvage, and hazard lanes bright enough for gameplay read.

- Added phase-based background scale to `GeoSphere`.
  - The sphere/ring scales from phase 1 toward a max of `1.5`.
  - `GameScene` updates the sphere phase on normal phase advancement, debug phase jumps, and wormhole exit phase jumps.

Verification:

- `npm.cmd run build` passed after escalation allowed Vite to write its temp config file.
