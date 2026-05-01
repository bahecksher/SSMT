# 2026-05-01 0206 Move Versus Countdown

## TL;DR
- What changed: Moved the embedded Versus countdown from the room-info area to the bottom action area and reduced its size slightly.
- Why: The countdown was sitting on top of the room code/opponent UI.
- What didn't work: No blocker.
- Next: Two-window smoke test and compact visual check.

---

## Full notes

Changed `src/game/scenes/MenuScene.ts`.

`showVersusCountdownNumber()` now positions the countdown at `getPrimaryActionMetrics(layout).centerY`, reusing the bottom action area that is blank while Versus is selected. The countdown font was reduced from `42/58` to `36/46` for compact/desktop layouts so it is less likely to collide with nearby UI.

Verification:
- `npm.cmd run build` passes.
