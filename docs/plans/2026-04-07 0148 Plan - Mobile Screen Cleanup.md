# Plan - Mobile Screen Cleanup
_Created: 2026-04-07 0148_

## Goal
Clean up crowded mobile layouts so Menu, Mission Select, HUD, pause, and result screens remain readable on narrow and short phone viewports.

## Approach
- Add shared viewport helpers for narrow-width and short-height phones so responsive branches line up across scenes.
- Tighten top-level Menu spacing, reserve comm-panel space correctly, and cap leaderboard rows based on available room instead of fixed minimums.
- Compress Mission Select card spacing, wallet/header copy, favor badges, and favor-card text so stacked cards stay readable on short screens.
- Reduce compact comm-panel typography, let the gameplay HUD move `BEST` to a second row when needed, and shrink result/pause overlays more aggressively on short phones.
- Verify the pass with `npm.cmd run build`.

## Scope boundaries
- No gameplay-balance tuning
- No art-direction or palette redesign
- No changes to mission logic, progression, or save-data structure

## Open questions
- Whether the bottom mission-pill gutter still needs an extra pass after on-device iPhone Safari testing
