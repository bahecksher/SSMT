# 2026-04-27 2135 HUD Scaling and Pause Clearance

## TL;DR
- What changed: Made the in-run `CREDITS // LIVES` header responsive to available top-row width and moved the pause panel to start below the actual HUD stack.
- Why: On tighter screens, the credits/lives cluster could push into the centered pause lane and then feel buried under the pause UI.
- What didn't work: The first build failed because `Hud.ts` still carried unused `lastScore` / `lastLives` fields after the refactor; removed them.
- Next: Browser-playtest the header on narrow and desktop viewports, especially Campaign pause states where lives are shown.

---

## Full notes

- `src/game/ui/Hud.ts`
  - Added adaptive top-row layout for the score/lives cluster.
  - Header now progressively falls back from full labels to compact labels and smaller font sizes based on the space left of the centered pause button.
  - Exposed `getTopHudBottom()` so other UI can respect the real top HUD height.
- `src/game/scenes/GameScene.ts`
  - Pause menu panel top now uses `Math.max(hudBottom, pauseButtonBottom) + gap`.
- Verification
  - `npm.cmd run build` passed.
