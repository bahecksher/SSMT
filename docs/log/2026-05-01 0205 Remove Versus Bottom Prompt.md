# 2026-05-01 0205 Remove Versus Bottom Prompt

## TL;DR
- What changed: Removed the bottom `ROOM SETUP ABOVE` text when Versus is selected on the main menu.
- Why: User wanted that prompt gone.
- What didn't work: No blocker.
- Next: Run the same compact visual and two-window Versus smoke checks from the prior room setup pass.

---

## Full notes

Changed `src/game/scenes/MenuScene.ts`.

The primary bottom action text now clears itself while `RunMode.VERSUS` is selected, instead of showing `ROOM SETUP ABOVE`. Arcade and Campaign still restore `TAP TO START`.

Verification:
- `npm.cmd run build` passes.
