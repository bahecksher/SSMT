# Plan revision - Pause Feature
_Created: 2026-03-27 1626_
_Revises: docs/plans/2026-03-27 1620 Plan - Pause Feature.md_

## What changed
- Resume from pause should not return immediately to gameplay.
- The pause flow now needs a visible `3 2 1 GO` countdown before the run resumes.

## Why
- The user explicitly asked for a countdown from the pause menu before gameplay continues.

## Updated approach
Only the resume path changes:
- keep the simulation frozen after leaving the pause menu
- show a centered `3 2 1 GO` countdown overlay
- resume the previously paused run state only after the countdown finishes
