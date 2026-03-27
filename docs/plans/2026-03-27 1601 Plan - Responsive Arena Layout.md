# Plan - Responsive Arena Layout
_Created: 2026-03-27 1601_

## Goal
Let the game adapt its arena shape to the browser/device viewport while keeping the starfield visible across the full page.

## Approach
1. Replace fixed screen and arena dimensions with runtime layout metrics derived from the current Phaser scale size.
2. Switch the Phaser scale mode from fixed-fit portrait to viewport resize so the canvas tracks the browser size.
3. Update entities, systems, and UI that currently read hard-coded dimensions so they use the current layout at spawn/update/draw time.
4. Keep the starfield and overlay effects sized to the live viewport, and redraw arena framing from the current layout.
5. Verify the game still builds and note any follow-up balance risks from wider/taller arenas.

## Scope boundaries
- No redesign of the core game loop or hazard roster
- No attempt to fully rebalance every phase for all monitor sizes in this pass
- No audio/settings work from the previous active voice plan

## Open questions
- Whether very wide desktop arenas need later difficulty tuning after playtesting
- Whether beam hazards should be clipped to the arena in a later polish pass
