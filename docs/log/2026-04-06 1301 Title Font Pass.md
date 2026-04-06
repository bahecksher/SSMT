# 2026-04-06 1301 Title Font Pass

## TL;DR
- What changed: Added `pixel_lcd` as a bundled webfont, waited for it in `BootScene`, and applied it to the main title moments on Menu, Mission Select, pause, and results.
- Why: The game needs a stronger visual signature, and the user selected `pixel_lcd` as the title font direction.
- What didn't work: Nothing blocked implementation; the rest of the UI intentionally stayed on the existing monospace stack for readability.
- Next: Playtest the title layouts on compact screens and decide whether to expand the new typography to more header moments.

---

## Full notes

- Extracted `pixel_lcd_7.ttf` from the provided zip into `public/fonts/`.
- Registered the font with `@font-face` in `index.html`.
- Added a dedicated `TITLE_FONT` constant in `src/game/constants.ts` so title styling can diverge from general UI styling without a broader font rewrite.
- Updated `BootScene` to wait on `document.fonts.load('16px \"pixel_lcd\"')` before starting Menu, with a safe fallback path.
- Swapped MenuScene headline text, MissionSelect `JOB BOARD`, GameScene pause title, and GameScene result title to `TITLE_FONT`.
- Verified with `npm.cmd run build`.
