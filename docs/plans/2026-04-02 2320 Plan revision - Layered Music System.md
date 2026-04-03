# Plan revision - Layered Music System
_Created: 2026-04-02 2320_
_Revises: docs/plans/2026-03-29 1753 Plan - Layered Music System.md_

## What changed
- Replace the original three `phase-lock` stems with the provided `Menu Synth`, `Bass 1`, `Drums 3`, `Bass 3`, `Synth 3`, `Full Phase 1`, and `Full Phase 2` exports.
- Re-map music by screen/state: `Menu Synth` on Menu, Pause, Destroyed, and Extract; `Menu Synth` + `Bass 1` on MissionSelect; `Drums 3` into `Bass 3` into `Synth 3` during gameplay; then hand off to one full late-game loop.
- Treat pause and result transitions as fades from the currently playing gameplay music instead of hard scene-local restarts.

## Why
- The user provided the actual soundtrack assets and clarified the intended scene-by-scene behavior for the current build.

## Updated approach
- Preload the seven WAV assets through the shared music manager and keep the looping layer tracks available for cross-scene fades.
- Drive gameplay progression from phase thresholds: drums at phase 1, bass added at phase 2, synth added at phase 4, then a single randomly chosen full track takes over from phase 6 onward for the rest of that run.
- Hook `GameScene` pause, death, extraction, and resume transitions so menu/result states fade to `Menu Synth` while gameplay restores the correct phase mix on return.
