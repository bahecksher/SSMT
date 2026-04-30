# 2026-04-30 1748 Natural Wormhole Rarity

## TL;DR
- What changed: natural wormholes now roll once per run, maybe choose one random phase 5-9, and never naturally spawn more than once in that run.
- Why: wormholes were becoming too predictable and should feel special, not guaranteed every run.
- What didn't work: no frequency feel pass yet.
- Next: test several natural runs to tune the run-level chance.

---

## Full notes

1. Files created/changed
   - `src/game/data/tuning.ts`
   - `src/game/scenes/GameScene.ts`
   - `docs/state.md`
   - `docs/log/2026-04-30 1748 Natural Wormhole Rarity.md`
2. What works
   - Added `WORMHOLE_SCHEDULED_RUN_CHANCE` tuning, currently `0.45`.
   - On run start, natural scheduled wormholes either choose no target or choose one random phase from 5-9.
   - The scheduled gate-like wormhole only appears in the chosen phase.
   - Rare-salvage wormhole drops respect the same natural one-per-run cap.
   - Entering a wormhole also marks the natural run cap used.
   - Debug `Shift+W` / `window.bitpSpawnWormhole()` remains deterministic and is not dependent on the natural roll.
   - `npm.cmd run build` passes.
3. What is still stubbed
   - No analytics/counter for observed wormhole frequency.
4. Risks or follow-up recommendations
   - 45% per run is a first-pass rarity value; tune after several real runs.
   - Debug phase jumps do not re-roll a run's natural wormhole target, which is intentional for preserving the run-level roll.
