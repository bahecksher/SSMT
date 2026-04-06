# 2026-04-06 1546 Button Accent Split Pass

## TL;DR
- What changed: kept the blue palette extraction gate on the player-blue thread while moving menu, Mission Select, pause, and result buttons back to the yellow HUD accent
- Why: the shared `GATE` color token was making UI buttons read blue after the extraction gate change, which felt off against the rest of the blue-palette chrome
- What didn't work: the first patch pass missed a pause-menu color reference and needed a quick follow-up sweep before verification
- Next: playtest the blue palette again and confirm the gate now reads as gameplay-specific while button chrome feels consistent across screens

---

## Full notes

Updated the button styling in `MenuScene`, `MissionSelectScene`, and `GameScene` so active UI buttons use `COLORS.HUD` instead of piggybacking on `COLORS.GATE`. This covers the main menu settings controls, leaderboard tabs, Mission Select settings buttons, the deploy button, the pause button, the pause palette button, and the result retry button.

The extraction gate itself still uses `COLORS.GATE`, so the blue gameplay-thread change remains intact without pulling the rest of the UI blue with it.
