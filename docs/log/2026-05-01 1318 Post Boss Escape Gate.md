# 2026-05-01 1318 Post Boss Escape Gate

## TL;DR
- What changed: Added a post-boss escape sequence: 15s grace, forced extract gate, heavy enemy surge, and wormhole-style collapsing boundary.
- Why: Boss victory needed a clear exit strategy that pressures the player to take the gate instead of lingering.
- What didn't work: No live in-browser run was performed during this pass.
- Next: Debug-spawn a boss, kill it, and tune the grace window / surge count / collapse duration by feel.

---

## Full notes
- Added post-boss escape tuning in `src/game/data/tuning.ts`.
- `ExtractionSystem` can now suppress normal gates and spawn a forced gate without advancing phase when that forced gate expires.
- `DifficultySystem` no longer starts the post-boss surge immediately on boss kill; `GameScene` triggers it when the 15s grace window ends.
- `GameScene` reuses the wormhole collapsing boundary renderer and burn/damage rules for post-boss escape pressure.
- `npm.cmd run build` passes.
