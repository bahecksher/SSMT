# Plan - Phase 10 Gunship Boss
_Created: 2026-04-06 2212_

## Goal
Add a phase-10 Regent gunship boss that reuses the existing run loop, fits the current collision model, and leaves behind a dangerous debris cleanup phase.

## Approach
- Create a dedicated boss entity that owns the edge-pass movement, gun state, beam projection, exposed-core state, and draw logic.
- Let `DifficultySystem` spawn and update the boss once phase 10 is reached, suppress the regular enemy/beam stream while the boss is active, and expose small boss event/drop hooks back to `GameScene`.
- Add boss-specific player interactions in `GameScene`: shield rams destroy guns, exposed-core entry/exit destroys the ship, and unshielded contact remains lethal.
- Reuse existing pickup/debris systems so destroyed guns can feed the shield loop and the boss death can flood the board with physical drifter debris plus visual breakup.
- Add concise comm/HUD support so the phase transition, core exposure, and boss kill read clearly during play.

## Scope boundaries
- No separate boss reward economy
- No new menu option or mode tied to boss fights
- No major refactor of the broader hazard/collision architecture beyond what the boss needs

## Open questions
- Whether phase-10 extraction should stay available during the boss fight or later become boss-gated; this pass keeps the existing phase loop unless implementation pressure proves it needs tighter control.
