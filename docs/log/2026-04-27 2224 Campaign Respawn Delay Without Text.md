# 2026-04-27 2224 Campaign Respawn Delay Without Text

## TL;DR
- What changed: Campaign second lives now restart after a 1-second silent warp-in instead of the full opening countdown, and no text is shown over the respawn.
- Why: The full reused countdown was too slow/noisy for a second life; the respawn should be quicker and cleaner.
- What didn't work: Nothing broke in build, but the exact feel of the 1-second gate timing still needs a live playtest.
- Next: Playtest a Campaign death on life 1 and confirm the shortened gate-only restart still reads clearly in motion.

---

## Full notes

- `src/game/scenes/GameScene.ts`
  - Added a dedicated `CAMPAIGN_RESPAWN_WARP_MS = 1000`.
  - `startWarpInAt()` now supports custom duration and optional text.
  - Campaign soft-respawn now uses the gate-only 1-second warp-in and does not call the old life-lost text overlay.
- Verification
  - `npm.cmd run build` passed.
