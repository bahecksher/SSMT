# 2026-04-07 0109 Menu Mode Label Removal

## TL;DR
- What changed: removed the `MODE` heading above the `CAMPAIGN` / `ARCADE` buttons on the menu screen
- Why: the two-button choice is already self-explanatory and the extra label added clutter
- What didn't work: nothing blocked this pass
- Next: keep an eye on whether any other menu headings are similarly redundant once the main screen is viewed on device

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` to remove the standalone `MODE` text object.
- Re-anchored the mode button row directly from the existing section top so the spacing still feels intentional without the heading.
- Left the helper text and button sizing intact so this remains a small visual cleanup.
- Verified with `npm.cmd run build`.
