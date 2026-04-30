# 2026-04-29 2150 Tutorial Header and Intro Comms

## TL;DR
- What changed: removed `STEP #/#` from the tutorial header, increased tutorial-only Slick comm persistence, and added a dedicated Slick intro line during the entry-warp wait before the first lesson.
- Why: user wanted less header clutter, more time to read the tutorial comms, and an actual intro from Slick while the player waits for the tutorial frame to come online.
- What didn't work: the old tutorial showed a redundant step counter, used a short comm timeout, and jumped straight into `MOVE` without any setup line during the gate wait.
- Next: quick live tutorial pass to make sure the new intro reads cleanly before `MOVE` replaces it and that the longer comm timing feels comfortable.

---

## Full notes

- Direct user request took priority over the current corporation-board polish plan, so this session intentionally diverged from `docs/plans/2026-04-29 2145 Plan - Corporation Board Layout Polish.md`.
- In `src/game/scenes/TutorialArenaScene.ts`:
  - tutorial comm auto-hide increased to `9000ms`
  - completion line bumped to `11000ms`
  - entry warp now triggers a new `tutIntro` line
  - section header now shows only the section title instead of `STEP n/5 // TITLE`
- In `src/game/data/slickLines.ts`:
  - added `tutIntro`
- `npm.cmd run build` passes.
