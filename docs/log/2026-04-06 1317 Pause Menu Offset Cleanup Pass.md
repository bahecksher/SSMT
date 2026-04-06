# 2026-04-06 1317 Pause Menu Offset Cleanup Pass

## TL;DR
- What changed: Moved the pause menu panel down so it clears the centered pause button and removed the `RUN AT CRAWL // DANGER LIVE` subtitle.
- Why: The centered pause button was overlapping the top of the pause menu UI, and the subtitle was no longer wanted.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the pause sheet on compact screens and confirm the new spacing still feels balanced.

---

## Full notes

- Updated `showPauseMenu()` in `src/game/scenes/GameScene.ts` to position the panel below the centered pause button instead of starting at the old top margin.
- Removed the pause subtitle line entirely.
- Rebalanced the title, abandon action, hint, and settings section offsets so the menu still reads cleanly after the panel shift.
- Verified with `npm.cmd run build`.
