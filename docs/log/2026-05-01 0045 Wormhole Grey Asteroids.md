# 2026-05-01 0045 Wormhole Grey Asteroids

## TL;DR
- What changed: Changed wormhole pocket asteroids back to the main-arena grey colors.
- Why: The yellow/gold asteroid palette made the pocket too visually noisy and reduced readability.
- What didn't work: No live phone visual pass was run in this session; only build verification.
- Next: Test pocket mode on a phone-sized viewport and confirm the grey asteroid field reads cleanly against the pocket background and boundary veil.

---

## Full notes

- Updated the pocket palette in `src/game/constants.ts`:
  - `ASTEROID` now uses `0xc4ccd3`.
  - `ASTEROID_INERT` now uses `0x69727c`.
- Left pocket salvage, gates, HUD, boundary colors, and cyan player color unchanged.
- Build verification passed with `npm.cmd run build`.
