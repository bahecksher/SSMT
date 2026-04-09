# Plan revision - Startup Loading Screen
_Created: 2026-04-09 0046_
_Revises: docs/plans/2026-04-09 0041 Plan revision - Startup Loading Screen.md_

## What changed
- Added a worldbuilding Slick intro line to the boot screen in addition to the secure-connection status line

## Why
- The user wanted some of the richer boot text back, but framed as part of Slick's world rather than internal loading diagnostics

## Updated approach
- Keep `Establishing Secure Connection...` as the primary boot status
- Pull a line from Slick's existing `menuIntro` pool and display it beneath the status line during the boot hold
- Preserve the starfield, globe/ring, loading bar, and ~4 second minimum display duration
