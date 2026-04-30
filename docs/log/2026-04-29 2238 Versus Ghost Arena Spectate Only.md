# 2026-04-29 2238 Versus Ghost Arena Spectate Only

## TL;DR
- What changed: Removed the opponent ghost arena from the active playing screen while preserving the ghost arena/detail view during post-death/post-extract spectate.
- Why: User wanted the active screen clean, with the ghost arena saved for the death screen where watching the opponent matters.
- What didn't work: N/A. Build passed after the change.
- Next: Two-window playtest to confirm active gameplay is clean and spectate still shows the peer arena with asteroids, salvage, lasers, and ship.

---

## Full notes

`src/game/scenes/GameScene.ts`:

- `createMirrorViewport()` now initializes the mirror display hidden.
- `updateMirrorViewport()` now clears/hides mirror graphics whenever `versusSpectating` is false.
- `beginVersusSpectate()` still calls `setMirrorVisible(true)` and promotes the mirror layers, so the death/extract waiting screen keeps the ghost arena and its mirrored detail.

Important behavior:

- Mirror snapshots still send/receive during active play; only rendering is suppressed.
- The sent-laser echo state still exists, but it will only be visible if the player is in the spectate view.

Verification:

- `npm.cmd run build` passes.
