# 2026-05-01 0204 Main Menu Versus Room Setup

## TL;DR
- What changed: Moved Versus room create/join controls into the main menu when the mode tab is set to Versus, and removed the old no-leaderboard placeholder text.
- Why: User wanted room setup underneath the Versus game mode on the main menu instead of entering a separate lobby menu first.
- What didn't work: No blocker. The separate `VersusLobbyScene` remains in the project but is no longer launched from the main menu.
- Next: Run a two-window Versus smoke test and a compact-menu spacing check.

---

## Full notes

Changed `src/game/scenes/MenuScene.ts`.

The main menu now imports and owns the same NetSession room flow that the separate lobby used:
- CREATE generates a room code.
- JOIN prompts for and validates a room code.
- WAITING shows the room code, opponent state, READY/UNREADY, and CANCEL.
- When both players are ready, the host broadcasts `MATCH_START`, both clients show the countdown, and the scene hands off into `MissionSelectScene` with `mode: RunMode.VERSUS` plus the multiplayer handoff.

The old menu placeholder text `1V1 MIRRORED LOBBY // NO LEADERBOARD YET` was removed. Versus selected on the main menu now shows `CREATE OR JOIN A ROOM` and action buttons instead.

Tapping the general menu background while Versus is selected now does nothing, so players use the visible CREATE/JOIN controls instead of falling through to `VersusLobbyScene`.

Verification:
- `npm.cmd run build` passes.
