# 2026-04-06 1249 Palette Border Direction Pass

## TL;DR
- What changed: Reworked the palette direction so black space stays dominant and the arena border carries the color identity
- Why: The game needed a clearer focal frame and stronger silhouette than full-board color washes were giving it
- What didn't work: I kept this pass focused on palette values and arena-border rendering only rather than retuning every UI panel in the project
- Next: Playtest which palette feels best with the new black-space / colored-frame approach and fine-tune from there

---

## Full notes

- Added a dedicated `ARENA_BORDER` palette color in `src/game/constants.ts`
- Darkened `STARFIELD_BG` and `BG` so the scene reads more like space again
- Moved orange `#eb742d`, blue `#2d3aeb`, and red `#eb2d30` into the arena-frame treatment instead of using them as the main board fill
- Updated `src/game/scenes/GameScene.ts` so the arena frame uses the palette border color, with a subtle inner line and stronger colored corners
- Left the globe treatment in place so it stays visually recessed behind the new frame direction
- `npm.cmd run build` passes
