# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0041_
_Revises: docs/plans/2026-04-09 0031 Plan - Startup Loading Screen.md_

## What changed
- Added a minimum boot-screen display duration target of about 4 seconds before transitioning to `MenuScene`

## Why
- The simplified loader could disappear too quickly on fast loads, leaving the startup presentation unreadable

## Updated approach
- Keep the current starfield, globe/ring, message, and loading bar in `BootScene`
- After assets and font sync complete, delay the `MenuScene` handoff until the boot screen has been visible for at least ~4 seconds total
