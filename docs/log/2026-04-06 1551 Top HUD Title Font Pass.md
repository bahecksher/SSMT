# 2026-04-06 1551 Top HUD Title Font Pass

## TL;DR
- What changed: moved the top arena `CREDITS` and `BEST` labels to the title font
- Why: those two top-line HUD labels were a good fit for the stronger display type, while the smaller support HUD text is better left on the readable font
- What didn't work: nothing major; this was a narrow typography swap
- Next: playtest the top HUD on compact screens and confirm the title font still reads cleanly at gameplay size

---

## Full notes

Updated `Hud` so the main top-line score labels use `TITLE_FONT`, while `SHIELD` and the smaller mission-pill typography still use `UI_FONT`. This keeps the display/header moments punchier without making the compact support text harder to read.
