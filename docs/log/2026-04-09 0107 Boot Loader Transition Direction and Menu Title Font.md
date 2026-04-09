# 2026-04-09 0107 Boot Loader Transition Direction and Menu Title Font

## TL;DR
- What changed: Flipped the boot-to-menu CRT transition so white shutters move outward from the center, and added a menu-title font refresh/reflow after `pixel_lcd` loads
- Why: The user wanted the transition direction reversed, the effect to be white instead of black, and the menu heading to actually show the title font
- What didn't work: No implementation blockers after the code pass; `npm.cmd run build` passed on the first verification run
- Next: Hard-refresh the browser and visually confirm the outward white transition and the title-font menu header on a cold load

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` so the boot handoff uses white top/bottom shutters that move off-screen instead of collapsing inward.
- Kept the center-line flash, but tuned it to stay in the same white CRT family as the shutters.
- Added a small title-block relayout helper and reapply the `TITLE_FONT` styling after `document.fonts.load('16px "pixel_lcd"')` resolves so the menu title re-renders in the intended font.
- Verified the project still builds with `npm.cmd run build`.
