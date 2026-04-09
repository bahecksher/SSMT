# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0050_
_Revises: docs/plans/2026-04-09 0046 Plan revision - Startup Loading Screen.md_

## What changed
- Changed the boot status line to `Securing Connecting`
- Forced both the boot status and Slick intro line to stay on one line instead of wrapping

## Why
- The user wanted the boot copy tightened further and specifically asked for a single-line presentation for both text elements

## Updated approach
- Keep the current starfield, globe/ring, loading bar, and ~4 second minimum display duration
- Render the top boot status in the title font without word wrapping
- Render the Slick intro without wrapping and fit both texts to the available width by shrinking as needed
