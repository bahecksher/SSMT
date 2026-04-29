# 2026-04-29 1909 Mobile Framerate Prioritization

## TL;DR
- What changed: Added an automatic constrained-viewport render profile and wired it into the heaviest recurring vector paths. Small phone-sized gameplay now uses fewer/redrawn-less-often stars, a lighter/slower geo-sphere redraw, throttled versus mirror repainting, and reduced dashed-ring detail on mineable asteroids and salvage zones.
- Why: User reported that the game is starting to chug on iPhone 13 mini and wants framerate prioritized without flattening the rest of the game.
- What didn't work: First build failed because a new `readonly` field in `DrifterHazard` also gets initialized through the fragment factory path. Removed the `readonly` qualifier and rebuilt cleanly.
- Next: Run a live phone pass on iPhone 13 mini, especially late-game gameplay and versus mirror/spectate, to see whether this pass is enough or whether we need one more round of cuts.

---

## Full notes

This session intentionally diverged from the active versus verification follow-up because the user explicitly raised runtime framerate concerns on iPhone 13 mini. The change set stayed small and targeted to render load rather than gameplay systems.

### New constrained render profile

Added `src/game/data/renderTuning.ts` with two profiles:

- default: existing visual density / cadence
- constrained: used automatically on narrow or short phone-sized viewports

Constrained profile values currently:

- gameplay starfield: `170 -> 96` stars
- gameplay starfield redraw cadence: every `33ms`
- geo-sphere detail: `subdivisions 2 -> 1`, ring segments `160 -> 96`, debris step `1 -> 2`
- geo-sphere redraw cadence: every `50ms`
- mirror redraw cadence: every `50ms` in live play, every `33ms` in spectate
- mineable asteroid dashed-ring segments: `12 -> 8`
- salvage dashed-ring segments: `16 -> 10`

### Geo-sphere throttling

`src/game/entities/GeoSphere.ts` now reads the render profile at construction time and:

- builds a lower-detail mesh on constrained screens
- redraws on a timed cadence instead of every frame
- keeps angle progression continuous so motion still reads smoothly despite the lower redraw rate

Because `GeoSphere` is shared by gameplay, menu, versus lobby, and Mission Select, this one change reduces cost across the main scene flow.

### Gameplay starfield + versus mirror throttling

`src/game/scenes/GameScene.ts` now:

- reads `RenderTuningProfile` at scene create
- spawns fewer gameplay stars on constrained phone-sized screens
- updates the gameplay starfield on a throttled cadence instead of repainting it every frame
- throttles the mirrored-versus arena redraw, while still forcing immediate redraws when snapshots arrive or spectate state changes

Important tradeoff: the network snapshot cadence itself is unchanged (`100ms`). This pass only reduces how often we repaint the mirrored arena between snapshots.

### Repeated dashed-ring cuts

`src/game/entities/DrifterHazard.ts` and `src/game/entities/SalvageDebris.ts` now use the render profile for their dashed-ring segment counts. This keeps the same effect language but lowers the amount of vector arc work that stacks up in active play.

### Verification

`npm.cmd run build` passes after the render pass.

### Risks / follow-up

- No live device verification yet on iPhone 13 mini after this pass.
- The menu / lobby / Mission Select background simulations still animate full debris / asteroid / NPC objects; if phone framerate is still shaky outside gameplay, those may be the next trims.
- If late-game gameplay still dips on constrained phones, the next candidate is a stronger gameplay-only background cut (for example, geo-sphere off in GameScene only, or an even lower gameplay-starfield cadence).
