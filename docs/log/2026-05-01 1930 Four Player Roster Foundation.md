# 2026-05-01 1930 Four Player Roster Foundation

## TL;DR
- What changed: Added 2-4 player roster helpers to `NetSystem` and updated the main-menu Versus lobby to display room rosters instead of one opponent.
- Why: Begin expanding Versus beyond 1v1 without pretending the downstream game loop is multi-peer-safe yet.
- What didn't work: 3-4 player deploy is still blocked intentionally because MissionSelect and GameScene still have single-peer state.
- Next: Refactor MissionSelect briefing readiness to track every active player.

---

## Full notes

Implemented the first safe slice of the four-player Versus expansion:

- Added `VERSUS_MIN_PLAYERS` / `VERSUS_MAX_PLAYERS`.
- Added sorted active-roster helpers to `NetSession`.
- Updated `getPeer()` to return the first active non-self peer for backward compatibility.
- Updated host election to ignore overflow users outside the active roster.
- Updated the embedded main-menu Versus lobby copy from opponent language to pilot/room language.
- Added roster display with ready/standby status.
- Kept ready/countdown launch limited to exactly two active players for now.

Verification:

- `npm.cmd run build` passes.

The next risky area is MissionSelect, where the current code has one `versusPeerLocked` boolean and broadcasts ready payloads without sender ids. That needs to become a per-player readiness map before a 3-4 player room can deploy cleanly.
