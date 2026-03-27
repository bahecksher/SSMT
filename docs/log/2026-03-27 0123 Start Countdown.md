# 2026-03-27 0123 Start Countdown

## TL;DR
- What changed: Added a large, bold center-screen `3, 2, 1` countdown before gameplay begins.
- Why: The run was starting immediately; the countdown gives a cleaner handoff from the menu into active play.
- What didn't work: No tuning pass yet on whether the countdown should end on `GO` or stay strictly numeric.
- Next: Playtest the pacing and decide whether the final beat should flash `GO` briefly.

---

## Full notes

- Added a `COUNTDOWN` game state so the match can initialize visually before player control and the rest of the gameplay systems become active.
- During countdown, the entry gate, hologram overlay, and starfield continue updating while the player and hazards remain paused.
- Added a large bold center text in `GameScene` with a slight pulse so the `3`, `2`, `1` reads clearly in the middle of the arena.
- Verification: `npm.cmd run build`
