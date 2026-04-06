# 2026-04-06 1246 Palette Globe Contrast Pass

## TL;DR
- What changed: Gave the background globe its own palette color and set it to black for the orange, blue, and red themes
- Why: The user wanted the globe to fall back visually on those stronger color palettes instead of competing with the board hue
- What didn't work: I kept this scoped to the globe only and did not retune any other background elements in the same pass
- Next: Play the colored palettes in motion and see if any other background layers also want to go darker

---

## Full notes

- Added a dedicated `GLOBE` palette color in `src/game/constants.ts`
- Set `GLOBE` to black for `ORANGE`, `BLUE`, and `RED`
- Left the green palette globe unchanged so the original treatment is still available there
- Updated `src/game/entities/GeoSphere.ts` to render from `COLORS.GLOBE` instead of borrowing the enemy color
- `npm.cmd run build` passes
