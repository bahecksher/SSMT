# 2026-04-29 2147 Corporation Board Column Tightening

## TL;DR
- What changed: tightened the corporation leaderboard row width so the corporation names and score values sit closer together while keeping the fixed-column layout.
- Why: user liked the new uniform alignment, but the names and points had too much horizontal space between them.
- What didn't work: the previous fixed-width row was a little too wide, which made the board feel overly spread out even though it was aligned.
- Next: quick live menu pass to make sure the tighter row width still feels balanced on both desktop and compact phone-sized viewports.

---

## Full notes

- Stayed within the current corporation-board layout plan; no plan revision needed.
- In `src/game/scenes/MenuScene.ts`, reduced the effective corporation row width used for the fixed rank / name / score columns.
- This keeps:
  - left-aligned rank and name columns
  - right-aligned score column
  - uniform row appearance
- `npm.cmd run build` passes after the spacing adjustment.
