# 2026-04-29 2148 Corporation Board Column Tightening Pass 2

## TL;DR
- What changed: tightened the corporation board columns one more step so corporation names and point totals sit a little closer together than the previous pass.
- Why: user wanted the corp names and points grouped a bit more tightly.
- What didn't work: the first tightening pass still left a little too much horizontal spread between the name column and the score column.
- Next: quick live menu glance to confirm this pass lands in the sweet spot on both desktop and compact phone-sized viewports.

---

## Full notes

- Stayed within the existing corporation-board layout plan.
- In `src/game/scenes/MenuScene.ts`, reduced the corporation row width again while keeping the same fixed rank / name / score column structure.
- `npm.cmd run build` passes after the tweak.
