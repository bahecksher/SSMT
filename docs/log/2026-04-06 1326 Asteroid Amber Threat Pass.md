# 2026-04-06 1326 Asteroid Amber Threat Pass

## TL;DR
- What changed: Gave asteroids their own palette colors and tuned them to a brighter Deepcore-style amber instead of reusing the generic hazard color.
- Why: The asteroids were blending too much with the other yellow accents and needed a more readable threat identity.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the asteroid color in motion and decide whether the amber should push even hotter or stay at this brighter mining-family look.

---

## Full notes

- Added `ASTEROID` and `ASTEROID_INERT` to the shared palette definition in `src/game/constants.ts`.
- Tuned those asteroid colors toward a brighter Deepcore-family amber across palettes.
- Updated `src/game/entities/DrifterHazard.ts` so asteroid bodies and damage bars use the new dedicated asteroid colors.
- Updated asteroid shatter/debris color usage in `src/game/systems/DifficultySystem.ts` and `src/game/scenes/GameScene.ts` so destruction matches the new asteroid palette thread.
- Verified with `npm.cmd run build`.
