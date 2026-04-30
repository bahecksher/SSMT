# Plan revision - Shared Versus Resource Loop
_Created: 2026-04-30 0019_
_Revises: docs/plans/2026-04-29 2339 Plan - Shared Versus Matchmaking Mode.md_

## What changed
- The next shared-versus phase focuses on making server-owned resources feel like arcade gameplay before adding enemies/NPCs/pickups.

## Why
- Manual testing showed PartyKit works and both players appear in one arena, but gameplay felt empty because the first server simulation used placeholder resource spawning.

## Updated approach
- Port arcade-like asteroid and salvage lifecycle to the server simulation:
  - phase-based asteroid spawn rates/caps and size pools
  - edge-spawned drifter travel instead of in-box bouncing
  - normal salvage edge spawns with delayed respawn
  - phase 2+ rare salvage timing
  - depletion warning windows before removal
- Keep enemies, NPCs, beams, and pickups for the next phase after the shared resource loop is tested.
