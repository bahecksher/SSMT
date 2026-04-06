# 2026-04-06 1240 Palette Saturation Pass

## TL;DR
- What changed: Pushed all four palettes to a much stronger full-color look by retuning the shared palette definitions
- Why: The first pass proved out the swap system, and this pass makes the palettes feel bolder and more intentional on screen
- What didn't work: I kept this scoped to palette values only rather than doing another broader readability or UI refactor pass
- Next: Play the four variants in motion and see which one holds up best over a full run

---

## Full notes

- Updated the shared palette table in `src/game/constants.ts`
- Darkened and saturated each background more aggressively so the palette identity reads immediately
- Turned up accent intensity across player, salvage, hazard, enemy, gate, HUD, grid, NPC, shield, and bomb colors
- Left the switching system itself untouched; this is purely a tuning pass on the live palette definitions
- `npm.cmd run build` passes
