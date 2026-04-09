# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0109_
_Revises: docs/plans/2026-04-09 0107 Plan revision - Startup Loading Screen.md_

## What changed
- Reduced the opacity of the outward white CRT transition so the shutters, center glow, and flash read as semi-transparent instead of solid white

## Why
- The user wanted the white transition softened back to a translucent look while keeping the new outward motion

## Updated approach
- Keep the current boot loader visuals, copy, progress behavior, outward motion, and menu title-font refresh intact
- Render the white CRT transition with lowered alpha values so the effect feels lighter and less like a full-screen wipe
