# 2026-03-29 0120 Leaderboard Tab Buttons

## TL;DR
- What changed: Reworked the menu leaderboard period labels into clickable `DAILY` and `WEEKLY` button tabs with a visible active state.
- Why: It was not clear which leaderboard period the player was currently viewing.
- What didn't work: Nothing blocked the change; this was a straight UI clarity pass.
- Next: Check the menu on-device to confirm the active tab reads clearly at a glance.

---

## Full notes

- Added tab background graphics and hit zones in `MenuScene` so daily and weekly behave like actual buttons instead of plain text labels.
- Updated the active/inactive styling so the selected period gets a brighter border, stronger fill, and full text opacity.
- Kept the period switch logic the same: clicking the inactive tab swaps `activePeriod`, redraws the tab state, and reloads the leaderboard.
- Verified the project still builds successfully with `npm.cmd run build`.
