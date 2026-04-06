# 2026-04-06 1314 Mission Select Favor Text Pass

## TL;DR
- What changed: Added more space above the Mission Select wallet line and increased the favor-card `COMPANY // LIAISON:` line to the larger mission-text sizing.
- Why: The wallet area still felt cramped, and the company/liaison line was too small to read comfortably.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the favor cards on compact screens and see whether any wrapping or card-height tweaks are still needed.

---

## Full notes

- Updated `getFavorSectionTop()` in `src/game/scenes/MissionSelectScene.ts` to give the wallet header a larger vertical offset.
- Increased the favor-card `COMPANY // LIAISON:` text to use the same larger sizing pattern as the main mission text treatment.
- Kept the offer line unchanged so the emphasis shifts toward the company/liaison identity without fully reworking the card structure.
- Verified with `npm.cmd run build`.
