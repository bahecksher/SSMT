# 2026-03-27 1609 Responsive Arena Layout

## TL;DR
- What changed: Replaced the fixed portrait game sizing with viewport-responsive layout metrics and updated gameplay/UI systems to use them.
- Why: The user wanted the starfield across the whole page and an arena that changes shape with the browser/device size.
- What didn't work: Nothing blocking; build passed. Responsive balance on very wide/tall screens still needs playtesting.
- Next: Playtest across desktop/mobile aspect ratios and tune hazard density if bigger arenas feel too generous.

---

## Full notes

This session intentionally diverged from `docs/plans/2026-03-27 0020 Plan - Slick Character Voice.md` because the user explicitly requested a layout-direction change.

Created `docs/plans/2026-03-27 1601 Plan - Responsive Arena Layout.md` for the new work, then switched Phaser from fixed `Scale.FIT` portrait sizing to `Scale.RESIZE`.

Added a runtime layout module and updated the following areas to read live viewport/arena dimensions instead of compile-time constants:
- scene starfields and arena frame drawing
- player clamping and gameplay spawn placement
- hazard, NPC, debris, and gate spawning/offscreen cleanup
- HUD, comm panels, overlays, and result-screen placement

Verification:
- `npm.cmd run build`

Follow-up risk:
- The arena now truly changes size with the browser, so very wide/tall displays may need difficulty tuning after playtesting.
