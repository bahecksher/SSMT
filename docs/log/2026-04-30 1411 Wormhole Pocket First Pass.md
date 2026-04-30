# 2026-04-30 1411 Wormhole Pocket First Pass

## TL;DR
- What changed: added a first playable wormhole pocket loop with rare-salvage wormhole drops, pocket-only spawn/extraction rules, palette swap, hidden globe, denser asteroid pressure, and a non-banking pocket return gate.
- Why: start Part 2 of the active boss + wormhole plan with a real end-to-end version of the wormhole instead of only scaffolding.
- What didn't work: no live feel pass yet; this session only build-verified the new loop.
- Next: play-test the wormhole cadence and readability, tune it, then circle back to the boss feel pass.

---

## Full notes

1. Files created/changed
   - `src/game/constants.ts`
   - `src/game/data/tuning.ts`
   - `src/game/data/phaseConfig.ts`
   - `src/game/entities/GeoSphere.ts`
   - `src/game/entities/WormholePickup.ts`
   - `src/game/scenes/GameScene.ts`
   - `src/game/systems/DifficultySystem.ts`
   - `src/game/systems/ExtractionSystem.ts`
   - `src/game/systems/SalvageSystem.ts`
   - `src/game/ui/Hud.ts`
   - `docs/state.md`
   - `docs/log/2026-04-30 1411 Wormhole Pocket First Pass.md`
2. What works
   - Rare salvage can now drop a wormhole in phases 5-9 when the arena is clear of extraction-gate state.
   - Collecting the wormhole enters a pocket mode that hides the globe, swaps to a dedicated palette, increases asteroid density/size bias, suppresses combat spawns, and shows a countdown in the HUD.
   - Pocket extraction gates run on a separate short cycle and return the run to normal play without banking.
   - Pocket timeout also returns the run to normal play automatically.
   - `window.bitpSpawnWormhole()` was added as a hidden debug hook alongside the existing phase-jump helper.
   - `npm.cmd run build` passes.
3. What is still stubbed
   - No special pocket audio / music state yet.
   - No versus support or mirror rendering for wormholes or pocket mode.
   - No live balance pass yet on drop chance, pocket duration, pocket gate timing, or asteroid density.
4. Risks or follow-up recommendations
   - The current rare-salvage-only spawn source may read too rarely in normal play; verify that before adding more systems on top.
   - Pocket density could be too hot on smaller devices because it intentionally pushes more large mineable asteroids at once.
   - If pocket gates feel too easy or too hard in practice, adjust cycle timing before touching reward multipliers.
