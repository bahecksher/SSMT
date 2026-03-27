# Plan - Pause Feature
_Created: 2026-03-27 1620_

## Goal
Add an in-run pause feature with a bottom-screen button and a pause menu that can abandon the current run back to the main menu.

## Approach
1. Add a dedicated paused state to the game flow so simulation and countdown logic stop cleanly while paused.
2. Add a bottom-centered pause button that is always available during active gameplay states.
3. Show a modal pause overlay with `RESUME` and `ABANDON RUN` actions.
4. Make sure pause interactions do not conflict with result-screen taps or the touch movement control.
5. Build the project and update session docs.

## Scope boundaries
- No separate settings/options screen inside pause
- No audio muting changes
- No save/resume of mid-run progress after leaving the game

## Open questions
- Whether countdown should remain pausable long-term or only full active gameplay should pause
