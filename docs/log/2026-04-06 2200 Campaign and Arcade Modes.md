# 2026-04-06 2200 Campaign and Arcade Modes

## TL;DR
- What changed: added campaign and arcade mode selection on the menu, split the old wallet into separate campaign/arcade wallets, added a saved campaign session with lives plus carried favors, and restricted leaderboard submissions to arcade
- Why: the project needed a two-mode structure where campaign has persistence and arcade stays leaderboard-safe
- What didn't work: the first Mission Select mode-copy pass used an extra subtitle line and crowded the board, so it was collapsed back to a single compact line before verification
- Next: playtest campaign life rollover plus favor carryover and decide whether local best score should also split by mode

---

## Full notes

- Wrote a new spec at `docs/spec/2026-04-06 2152 Spec - Campaign and Arcade Modes.md` and a new plan at `docs/plans/2026-04-06 2152 Plan - Campaign and Arcade Modes.md`.
- This session intentionally diverged from the previously active palette-preview plan because the user redirected work to the new mode system; the palette work was left intact.
- Save migration maps the legacy single wallet into the new arcade wallet so existing progress is preserved instead of duplicated.
- MenuScene now owns the selected mode UI and starts Mission Select with the chosen mode.
- MissionSelectScene now spends from the active mode wallet, keeps carried campaign favors active without recharging them, and only bills newly added campaign favors.
- GameScene now tracks the run mode, decrements campaign lives on death, clears campaign favors only on true game over, and changes result-button flow for `NEXT LIFE`, `NEXT RUN`, and `NEW CAMPAIGN`.
- BankingSystem and death handling now gate leaderboard score/loss submission to arcade only.
- Verification: `npm.cmd run build`
