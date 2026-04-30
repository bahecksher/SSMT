# Plan - Versus Mirror Environment Detail
_Created: 2026-04-29 2224_

## Goal
Expose more of the opponent's live arena behind the local arena in versus, specifically asteroids, salvage, and lasers.

## Approach
- Extend the existing `MirrorSnapshot` payload with low-fidelity asteroid, salvage, and laser data normalized to arena coordinates.
- Reuse the current full-arena mirror backdrop in `GameScene` instead of creating a second live scene or any kind of screen/video streaming.
- Keep the render cheap by drawing simplified ghost geometry and by preserving the current mobile mirror redraw throttles.

## Scope boundaries
- No full remote-screen streaming.
- No duplicated remote HUD, comms, menus, or result UI.
- No shared RNG or authoritative server changes.
- No boss-specific mirror pass unless standard beam mirroring proves insufficient.

## Open questions
- Whether constrained phone-sized viewports need an extra opt-in toggle if the added mirror detail reintroduces framerate issues.
