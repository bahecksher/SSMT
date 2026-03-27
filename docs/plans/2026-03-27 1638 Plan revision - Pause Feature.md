# Plan revision - Pause Feature
_Created: 2026-03-27 1638_
_Revises: docs/plans/2026-03-27 1626 Plan revision - Pause Feature.md_

## What changed
- Resume should no longer use a `3 2 1 GO` countdown.
- Pause should no longer fully freeze the run.
- While paused, the game should continue at an extremely slow crawl so collisions can still kill the player.

## Why
- The user wants the pause state to feel more arcade-like, with danger still present, while still being too slow to use as practical gameplay.

## Updated approach
Only the pause behavior changes:
- remove the dedicated resume-countdown state and overlay
- keep the pause menu UI and abandon flow
- disable player control while paused
- run the underlying simulation at a very low time scale so hazards, timers, and collisions still advance
