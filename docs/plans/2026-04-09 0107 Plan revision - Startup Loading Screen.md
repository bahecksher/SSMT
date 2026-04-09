# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0107_
_Revises: docs/plans/2026-04-09 0101 Plan revision - Startup Loading Screen.md_

## What changed
- Flipped the boot handoff so the white CRT shutters push outward from the center
- Added a menu-title font refresh path after `pixel_lcd` loads so the menu heading reflows in the intended title face

## Why
- The user wanted the CRT handoff to feel like it moves outward instead of inward, to use white instead of black, and to ensure the menu visibly uses the title font

## Updated approach
- Keep the current boot loader visuals, copy, and progress behavior intact
- Reveal the menu with white half-screen shutters that move off-screen from the center while the center line and flash fade out
- Reapply the title font to the menu heading after the browser confirms `pixel_lcd` is loaded, then relayout the stacked title block
