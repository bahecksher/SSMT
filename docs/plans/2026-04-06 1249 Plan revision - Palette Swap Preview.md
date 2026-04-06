# Plan revision - Palette Swap Preview
_Created: 2026-04-06 1249_
_Revises: docs/plans/2026-04-06 1235 Plan - Palette Swap Preview.md_

## What changed
- Shifted the visual direction away from fully colored board fills toward near-black space with palette color concentrated on the arena frame
- Added dedicated palette control for the background globe and arena border so those elements can carry the look independently

## Why
- The colored full-screen backgrounds proved the palette system worked, but the game still lacked a strong silhouette and focal frame
- Black space gives the playfield more depth, and a colored arena border makes each theme read faster and more intentionally

## Updated approach
- Keep `STARFIELD_BG` and panel `BG` near-black or very dark across palettes
- Use the palette identity color on the arena border instead of flooding the whole board
- Let the globe sit back visually, including black treatment on the orange/blue/red themes where that improves contrast
