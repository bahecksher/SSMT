# Plan revision - Layered Music System
_Created: 2026-04-02 2354_
_Revises: docs/plans/2026-04-02 2340 Plan revision - Layered Music System.md_

## What changed
- Add the new `Drums 2` stem to the repo and use it for the early gameplay buildup.
- Simplify MissionSelect music from a layered menu blend to `Bass 1` alone.
- Replace the threshold-based gameplay mix logic with an explicit per-phase progression from phase 1 through phase 5.

## Why
- The user provided a new early drum loop and clarified the intended soundtrack ramp for each phase.

## Updated approach
- Preload `drums-2.wav` alongside the existing layered tracks.
- Keep `Bass 1` as the shared early stem for MissionSelect and phases 1-3.
- Use discrete mixes for phases 1, 2, 3, and 4, then hand off to a randomly chosen full track at phase 5+.
