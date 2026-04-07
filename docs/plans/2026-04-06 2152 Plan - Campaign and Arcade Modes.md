# Plan - Campaign and Arcade Modes
_Created: 2026-04-06 2152_

## Goal
Add menu-selectable campaign and arcade modes with separate wallets, campaign lives, campaign favor carryover, and arcade-only leaderboard submission.

## Approach
- Extend save data to track the selected mode, separate wallet balances, and a small campaign session state containing remaining lives plus carried favors.
- Add mode selection to the menu and make the menu start flow pass the active mode into Mission Select and GameScene.
- Make Mission Select read and spend the wallet for the active mode, pre-arm carried campaign favors without charging again, and allow new purchases to fill the remaining favor slots.
- Make gameplay/results use the active mode to decide wallet deposits, leaderboard submission, retry/next-run behavior, and whether campaign favors/lives persist or reset.
- Keep the changes targeted to scene handoff and save helpers rather than rewriting the mission or favor systems.

## Scope boundaries
- No new backend tables or schema changes
- No separate mission progression trees per mode
- No broad menu layout redesign outside the mode selector and related status copy

## Open questions
- Whether campaign and arcade should eventually have separate local best-score tracking; this pass keeps the existing best-score behavior unless implementation pressure proves otherwise.
