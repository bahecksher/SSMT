# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0101_
_Revises: docs/plans/2026-04-09 0059 Plan revision - Startup Loading Screen.md_

## What changed
- Swapped the boot status line from the title font to the alternate UI font while keeping the existing copy, layout, and transition behavior

## Why
- The user wanted the loading-screen status text to use the other font so it better matches the intended look

## Updated approach
- Keep the current startup loader visuals, progress behavior, and CRT handoff intact
- Render the `Securing Connecting` status line with `UI_FONT` instead of `TITLE_FONT`
