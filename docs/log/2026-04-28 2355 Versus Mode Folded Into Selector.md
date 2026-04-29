# 2026-04-28 2355 Versus Mode Folded Into Selector

## TL;DR
- What changed: the menu's shared mode selector now cycles `ARCADE`, `CAMPAIGN`, and `VERSUS`, and the old separate `VERSUS` button was removed.
- Why: keep game-mode selection in one place instead of splitting normal runs and versus across different controls.
- What didn't work: the build initially failed on a missing `lerpAngleShortest` helper in the in-progress multiplayer rendering path; fixed in this session so the project stays runnable.
- Next: manual tap-through the three-state selector and keep pushing the mirrored versus integration.

---

## Full notes

- Extended `RunMode` with `VERSUS` so the menu can persist that selection instead of treating versus like a one-off side action.
- Updated `MenuScene` so:
  - the mode button cycles `ARCADE`, `CAMPAIGN`, `VERSUS`
  - arcade still shows weekly global boards
  - campaign still shows the local campaign board
  - versus shows matchmaking/no-leaderboard status
  - `TAP TO START` routes to `VersusLobbyScene` when versus is active
- Removed the separate `VERSUS` menu button to avoid duplicate entry points.
- Tightened `GameScene` for mirrored runs:
  - multiplayer launches force `RunMode.VERSUS`
  - score recording and payouts are blocked
  - result messaging reads as versus-specific instead of "debug run"
- Added the missing `lerpAngleShortest` helper used by the current multiplayer snapshot preview so `npm.cmd run build` passes again.
