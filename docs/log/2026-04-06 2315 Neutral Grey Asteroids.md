# 2026-04-06 2315 Neutral Grey Asteroids

## TL;DR
- What changed: Replaced the bright orange asteroid palette with neutral grey shades across all color themes.
- Why: The asteroid lane was carrying too much visual heat and competing with salvage and hostile faction colors on the board.
- What didn't work: This pass did not redesign asteroid rendering itself; it only changed the color slots that the current visuals already use.
- Next: Playtest for readability and decide whether mineable asteroid rings should stay grey too or reclaim a small accent color later.

---

## Full notes

- Updated `src/game/constants.ts` so `ASTEROID` now uses a light grey and `ASTEROID_INERT` uses a darker slate grey across all palettes.
- This automatically updates asteroid bodies, mineable rings, asteroid HP bars, and asteroid debris because those visuals already route through the shared asteroid color slots.
- Verified with `npm.cmd run build`.
