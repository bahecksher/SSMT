# Plan revision - Mirrored Versus Full Arena Mirror
_Created: 2026-04-29 1132_
_Revises: docs/plans/2026-04-29 1117 Plan revision - Mirrored Versus Multiplayer Rematch.md_

## What changed
- The peer mirror moves from a bottom-right picture-in-picture overlay to a full-arena ghost backdrop behind local gameplay.
- Phase 5 polish now prioritizes readability tuning for the larger mirror presentation.

## Why
- User feedback preferred a mirror that matches the local arena footprint instead of a small corner inset.
- Placement is the main Phase 5 UX question and affects whether later polish should focus on styling or data fidelity.

## Updated approach
- Reuse the existing `MirrorSnapshot` interpolation and arena-fraction mapping.
- Resize the mirror render bounds to the live arena rectangle.
- Lower the mirror render depth so peer entities sit behind local gameplay and disappear on the result screen as before.
- Keep rematch, terminal events, and session reuse unchanged.
