# 2026-04-30 1638 Gate-like Wormhole Spawns

## TL;DR
- What changed: made wormholes appear as scheduled gate-like arena events in phases 5-9, lowered the old rare-salvage-only chance, and added hidden debug spawn shortcuts / console hooks for wormholes, shields, bombs, and credit bonuses.
- Why: rare salvage was too unreliable to see a wormhole in normal testing, and drops needed the same low-friction debug treatment as phase jumps.
- What didn't work: `npm.cmd run dev -- --host 0.0.0.0` reports Vite ready in the foreground, but attempts to leave it running in the background did not stay reachable from this sandbox session.
- Next: live-test phase 5 for wormhole preview readability, collectability, pocket entry, pocket exit, and timeout restore.

---

## Full notes

1. Files created/changed
   - `src/game/data/tuning.ts`
   - `src/game/entities/WormholePickup.ts`
   - `src/game/scenes/GameScene.ts`
   - `docs/state.md`
   - `docs/log/2026-04-30 1638 Gate-like Wormhole Spawns.md`
2. What works
   - Wormholes now have a gate-like preview mode with a large collapsing forecast ring before they become collectable.
   - Phases 5-9 now schedule one visible wormhole opportunity after a short delay when no extraction gate is active.
   - Rare salvage can still create surprise wormholes, but at a lower chance because it is no longer the primary discovery path.
   - Debug shortcuts now cover the key spawn/drop cases:
     - `Shift+W` / `window.bitpSpawnWormhole()`
     - `Shift+S` / `window.bitpSpawnShield()`
     - `Shift+B` / `window.bitpSpawnBomb()`
     - `Shift+C` / `window.bitpSpawnBonus()`
   - Debug spawn hooks mark the run as score-recording blocked, matching phase-jump behavior.
   - `npm.cmd run build` passes.
3. What is still stubbed
   - No special pocket audio / music state yet.
   - No versus support or mirror rendering for wormholes or pocket mode.
   - Scheduled wormhole timing and active-window length are first-pass values.
4. Risks or follow-up recommendations
   - The scheduled wormhole currently favors testing visibility; after a live pass, tune whether every eligible phase should get one opportunity or whether it should be probabilistic.
   - The wormhole preview can overlap with the normal extraction-gate preview if the player ignores it long enough; verify this reads clearly in motion.
   - Background dev-server launch from this sandbox did not stay reachable even though foreground `npm.cmd run dev -- --host 0.0.0.0` reports Vite ready at `http://localhost:5173/`.
