# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0116_
_Revises: docs/plans/2026-04-09 0109 Plan revision - Startup Loading Screen.md_

## What changed
- Replaced the outward-only transition with a two-beat CRT handoff that closes inward to a narrow slit and then opens back out
- Shifted the transition treatment from semi-transparent white to a softer HUD-tinted overlay

## Why
- The user wanted the menu handoff to feel less abrasive and asked for a close-in plus open transition instead of the current single outward pass

## Updated approach
- Keep the current boot loader visuals, copy, progress behavior, and menu title-font refresh intact
- Animate translucent top and bottom shutters inward from the screen edges to create a brief center slit, then open them back out
- Use the palette HUD color for shutters and flash so the effect feels integrated with the game instead of reading as a blunt white wipe
