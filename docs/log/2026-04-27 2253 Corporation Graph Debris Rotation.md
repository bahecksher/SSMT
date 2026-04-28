# 2026-04-27 2253 Corporation Graph Debris Rotation

## TL;DR
- What changed: Put the `CORPS` chart debris on its own animated layer so it rotates slowly, and reworked the debris pattern to use many more, much smaller fragments.
- Why: The chart needed more motion and a finer-grain arena-debris look instead of a sparser chunkier texture.
- What didn't work: No browser playtest yet, so the live motion and density are only build-verified right now.
- Next: Open the main menu in `ARCADE`, switch to `CORPS`, and check that the debris drift feels subtle and that the denser micro-fragments stay readable.

---

## Full notes

- Split the corp chart into static base art, an animated debris layer, static overlay strokes, and the center globe so only the debris needs to redraw each frame.
- Added a slow debris spin rate separate from the much faster Tortuga globe spin.
- Increased debris counts and shrank fragment sizes so the ring reads as a finer dust-and-shard field instead of a few larger chunks.
- `npm.cmd run build` passes after the animation and density update.
