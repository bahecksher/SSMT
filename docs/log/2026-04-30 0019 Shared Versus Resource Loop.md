# 2026-04-30 0019 Shared Versus Resource Loop

## TL;DR
- What changed: upgraded the shared-versus server resource loop from placeholder population to arcade-like asteroid/salvage spawning and lifecycle.
- Why: two-window testing confirmed PartyKit and peer rendering worked, but the shared world felt empty/mismatched.
- What didn't work: exact HP drain assertions were too brittle once salvage began moving from offscreen like live gameplay.
- Next: run another two-window shared-versus playtest and then port enemies/NPCs/pickups.

---

## Full notes
- `SharedWorldSimulation` now owns phase-based drifter spawn timing, max counts, size pools, and speed scaling.
- Drifters now spawn from an arena edge and travel across the field instead of bouncing inside the normalized box.
- Normal salvage now spawns from an edge, drifts through the arena, and respawns after a `SALVAGE_RESPAWN_DELAY`-style gap.
- Rare salvage starts at phase 2 with the same broad interval shape as the local game.
- Depleted resources remain briefly in snapshots before removal so client visuals can show the depleted/flashing state.
- Verification:
  - `npm.cmd test` passes.
  - `npm.cmd run build` passes.
  - `npx.cmd tsc --noEmit --target ES2023 --module ESNext --moduleResolution Bundler --skipLibCheck --strict --types partykit/server partykit/shared-versus.ts` passes.
