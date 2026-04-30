# Plan revision - Tutorial Arena Shield Lesson
_Created: 2026-04-29 2126_
_Revises: docs/plans/2026-04-28 0206 Plan - Tutorial Arena Rework.md_

## What changed
- The shield lesson no longer accepts any two shield losses in any order.
- The first shield is now reserved for destroying an enemy ship.
- The second shield is now reserved for destroying an asteroid, and that asteroid now splits like the live game.

## Why
- User feedback was that the HOW TO PLAY shield section felt wonky and was teaching the wrong sequence.
- The tutorial asteroid was disappearing outright instead of demonstrating the live shield-vs-asteroid split behavior.

## Updated approach
- On entering the SHIELDS section, clear lingering danger-section hostiles so the lesson starts from a controlled state.
- Spawn one shield first; after pickup, spawn the enemy for the first protected collision.
- After that collision, spawn a second shield; after pickup, spawn the asteroid for the second protected collision.
- Update the objective text and Slick lines to reflect the current sub-step.
- Use the same fragment scale/scatter logic as the live game when a tutorial shield destroys an asteroid.
