# 2026-03-29 0016 Text Rendering Sharpness

## TL;DR
- What changed: added a global higher-resolution text render path and enabled pixel rounding in Phaser so UI text reads cleaner across the game
- Why: fonts were looking soft/fuzzy even after the MissionSelect layout fixes
- What didn't work: scene-level spacing changes helped fit the UI but did not address the underlying text rendering softness
- Next: check a couple of screens on-device to make sure the sharper text looks better without introducing jitter

---

## Full notes

- Patched `scene.add.text(...)` globally in `main.ts` so every Phaser text object renders at a capped higher internal resolution based on device pixel ratio.
- Enabled `roundPixels` in the game config and `autoRound` in the scale config so centered text and canvas sizing stop landing on blurry half-pixels.
- Left the scene-level typography unchanged; this is a rendering cleanup rather than a font redesign.
- Verified with `npm.cmd run build`.
