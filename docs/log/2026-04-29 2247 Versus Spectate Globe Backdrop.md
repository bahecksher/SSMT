# 2026-04-29 2247 Versus Spectate Globe Backdrop

## TL;DR
- What changed: The versus death/spectate screen now shows the active game's globe/ring background above the opaque local-run backing and behind the peer ghost arena.
- Why: A flat black spectate screen felt boring after hiding the local frozen arena.
- What didn't work: N/A. Build passed after the change.
- Next: Two-window visual check to confirm the globe/ring backdrop adds atmosphere without making the peer mirror hard to read.

---

## Full notes

`src/game/entities/GeoSphere.ts`:

- Added `GeoSphere.DEFAULT_DEPTH`.
- Added `setDepth(depth)` so scenes can temporarily promote the background layer without exposing its internals.

`src/game/scenes/GameScene.ts`:

- Added `MIRROR_SPECTATE_GEOSPHERE_DEPTH`.
- `beginVersusSpectate()` now raises the existing globe/ring background above the opaque local-run backing.
- `endVersusSpectate()` restores the globe/ring background to its normal gameplay depth.

The spectate backing remains fully opaque, so local asteroids/salvage from the ended run stay hidden. Only the safe atmospheric globe/ring layer is promoted.

Verification:

- `npm.cmd run build` passes.
