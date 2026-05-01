# 2026-05-01 0016 Wormhole Player Readability

## TL;DR
- What changed: Made the player ship easier to see in wormhole pocket mode.
- Why: The pocket palette used a white player with warm yellow glow against a yellow/gold background, making the ship hard to track on phones.
- What didn't work: No live phone visual pass was run in this session; only build verification.
- Next: Test pocket mode on a phone-sized viewport and confirm the ship remains visible during dense asteroid motion.

---

## Full notes

- Changed the pocket palette player color from white/yellow to electric cyan in `src/game/constants.ts`.
- Updated `Player.draw()` to use `COLORS.PLAYER_GLOW` for the outer glow.
- Added a subtle `COLORS.BG` backing stroke under the player triangle before drawing the bright body stroke. This gives the stroke contrast over bright salvage, asteroids, and pocket background colors.
- Build verification passed with `npm.cmd run build`.
