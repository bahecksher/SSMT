# 2026-03-27 0118 Starfield Drift

## TL;DR
- What changed: Reworked the static starfield into a lightweight drifting background with per-star speeds.
- Why: The arena background needed a little ambient movement to feel less still during play.
- What didn't work: No in-game tuning pass yet, so the current drift is intentionally conservative.
- Next: Playtest on desktop and mobile to see whether the motion should be slightly stronger or include horizontal parallax.

---

## Full notes

- Added a small `StarfieldStar` data structure in `GameScene` so stars can be simulated and redrawn each frame instead of being painted once at scene creation.
- Stars now move downward at varied slow speeds and wrap back to the top when they leave the screen, preserving the existing hologram-tinted look.
- Kept the motion subtle to avoid competing with salvage zones, hazards, and UI overlays.
- Verification: `npm.cmd run build`
