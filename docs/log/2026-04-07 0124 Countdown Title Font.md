# 2026-04-07 0124 Countdown Title Font

## TL;DR
- What changed: switched the gameplay countdown phrases over to the title font
- Why: the countdown was still using the older UI-font treatment while the rest of the major gameplay headline copy had moved to the title-font look
- What didn't work: nothing blocked this pass
- Next: keep an eye on whether the thicker title glyphs want any shadow or spacing tuning on smaller screens

---

## Full notes

- Updated `src/game/scenes/GameScene.ts` so the pre-run countdown text now uses `TITLE_FONT` instead of `UI_FONT`.
- Left the countdown sizing, bold weight, stroke, and shadow settings intact so this stays a targeted typography pass.
- Verified with `npm.cmd run build`.
