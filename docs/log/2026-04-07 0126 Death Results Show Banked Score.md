# 2026-04-07 0126 Death Results Show Banked Score

## TL;DR
- What changed: death/game-over results now show banked credits as the main score line and move the unbanked loss to a separate detail line
- Why: the previous death screen emphasized what was lost instead of the actual run progress that had already been banked
- What didn't work: nothing blocked this pass
- Next: play a few runs with mixed banked and unbanked totals to make sure the new emphasis feels clearer in practice

---

## Full notes

- Updated `src/game/scenes/GameScene.ts` so death results now pass both banked score and lost unbanked credits into the result UI.
- The main result score line always reads `CREDITS BANKED`, including on death/game-over.
- When the player dies carrying unbanked credits, the result screen now shows `UNBANKED LOST` as a separate secondary line instead of using it as the headline score.
- Leaderboard/biggest-loss submission behavior was left unchanged in this pass; this is a result-screen presentation change.
- Verified with `npm.cmd run build`.
