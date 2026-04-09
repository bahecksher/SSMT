# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0059_
_Revises: docs/plans/2026-04-09 0050 Plan revision - Startup Loading Screen.md_

## What changed
- Increased the startup Slick intro text size while keeping it single-line
- Changed the loading bar so it stays meaningful until the exact menu handoff moment
- Added a CRT-style reveal transition into `MenuScene`

## Why
- The user wanted the loader flavor line to read more clearly, the bar to avoid looking finished too early, and the menu handoff to feel more like a TV powering on

## Updated approach
- Keep the current boot copy structure and ~4 second minimum display duration
- Reserve the final segment of progress for the post-load wait so the bar does not hit full before the menu can appear
- Start `MenuScene` with a boot-transition flag and reveal it using a center-out black shutter plus bright scan-line flash
