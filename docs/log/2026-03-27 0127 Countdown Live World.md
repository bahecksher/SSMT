# 2026-03-27 0127 Countdown Live World

## TL;DR
- What changed: The arena simulation now continues running during the `3, 2, 1` start countdown while player control stays locked until gameplay begins.
- Why: The countdown animation felt right, but the world underneath it felt artificially paused.
- What didn't work: No live balancing pass yet on whether hazards feel too active during the countdown window.
- Next: Playtest whether the current live-world countdown feels readable and fair on mobile and desktop.

---

## Full notes

- Reworked `GameScene.update()` so countdown and playing states share the main world update flow instead of returning early during countdown.
- Player input, salvage scoring, extraction, pickup collection, and player death checks remain gated behind `PLAYING`, so the player still gets a real start buffer.
- Hazards, debris, NPCs, enemies, the entry gate, and the starfield now continue updating during the countdown, which makes the run feel continuous from the first frame.
- Verification: `npm.cmd run build`
