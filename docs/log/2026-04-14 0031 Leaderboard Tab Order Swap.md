# 2026-04-14 0031 Leaderboard Tab Order Swap

## TL;DR
- What changed: Swapped the horizontal positions of the `CORPS` and `PILOTS` leaderboard tabs on the main menu.
- Why: The user wanted the two leaderboard tabs to trade places.
- What didn't work: Nothing notable; this was a targeted coordinate swap in the menu scene.
- Next: Continue menu playtesting to see whether the corporation board should remain rep-driven or eventually get a dedicated enlistment flow.

---

## Full notes

- Updated the leaderboard tab placement in `MenuScene` so `CORPS` now renders on the left side of the leaderboard toggle row and `PILOTS` on the right.
- Left the interaction behavior, active-state styling, and default selected view unchanged.
- Confirmed the project still builds successfully with `npm.cmd run build`.
