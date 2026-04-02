# 2026-04-02 1749 Result Bar Title Font Pass

## TL;DR
- What changed: Increased the result-bar title size and removed the extra bold styling from the `DESTROYED` / `EXTRACT` bar title text.
- Why: The user wanted `DESTROYED` to fill more of the bar and read in the same font treatment as the rest of the game UI.
- What didn't work: No live phone viewport check happened in-session; this pass was verified by build and code inspection only.
- Next: Visually check the destroyed/extract bars on-device and trim further if the title still feels off.

---

## Full notes

- Updated [GameScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/GameScene.ts) so the result-bar title scales much closer to the bar height and uses the base `UI_FONT` styling without the separate bold override.
- Verified with `npm.cmd run build`.
