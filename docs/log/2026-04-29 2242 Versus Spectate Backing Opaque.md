# 2026-04-29 2242 Versus Spectate Backing Opaque

## TL;DR
- What changed: Made the versus spectate/death backing fully opaque so the local frozen arena no longer shows through behind the peer ghost arena.
- Why: The death screen looked like it was still populated with local asteroids and salvage.
- What didn't work: N/A. Build passed after the change.
- Next: Two-window visual check to confirm only the peer ghost arena detail is readable during spectate.

---

## Full notes

`src/game/scenes/GameScene.ts`:

- Changed `MIRROR_SPECTATE_BG_ALPHA` from `0.78` to `1`.
- Updated the nearby comment to clarify that the peer arena should be the only readable playfield during spectate.

The mirror entities still render above the backing, so peer asteroids, salvage, lasers, and ship remain visible. The local frozen run should no longer visually leak underneath.

Verification:

- `npm.cmd run build` passes.
