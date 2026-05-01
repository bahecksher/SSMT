# 2026-05-01 0022 Wormhole Boundary Mask Fix

## TL;DR
- What changed: Flipped the wormhole boundary fill path direction.
- Why: The first boundary readability pass rendered inverted in-game: the inside looked like the intended outside and the outside looked like the intended inside.
- What didn't work: The previous path winding assumption was backwards for this Phaser graphics fill.
- Next: Re-test pocket mode and confirm the safe circle is clear while the exterior danger veil is opaque.

---

## Full notes

- Changed the inner arc direction in `drawPocketBoundary()` so the fill mask should apply to the exterior area around the circle instead of the safe interior.
- Kept the stronger alpha and outside-only rings/ticks from the boundary readability pass.
- Build verification passed with `npm.cmd run build`.
