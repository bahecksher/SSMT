# Plan revision - Tutorial Arena Intro and Comms
_Created: 2026-04-29 2150_
_Revises: docs/plans/2026-04-29 2126 Plan revision - Tutorial Arena Shield Lesson.md_

## What changed
- Remove the `STEP #/#` wording from the tutorial header.
- Keep tutorial Slick comms on screen longer.
- Add a dedicated Slick intro line during the tutorial entry-warp wait before the first lesson starts.

## Why
- User feedback was that the step counter was unnecessary clutter, the comms disappeared too quickly to read comfortably, and the tutorial needed a stronger onboarding beat while the player waits for the frame to come online.

## Updated approach
- Keep the top-center section header, but reduce it to the section title only.
- Increase tutorial-only comm auto-hide duration instead of changing global comm timing.
- Fire a new `tutIntro` line from the entry-warp setup so Slick speaks during the gate-drop wait.
