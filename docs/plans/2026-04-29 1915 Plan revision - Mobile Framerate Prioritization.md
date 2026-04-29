# Plan revision - Mobile Framerate Prioritization
_Created: 2026-04-29 1915_
_Revises: docs/plans/2026-04-29 1909 Plan - Mobile Framerate Prioritization.md_

## What changed
- Shifted from broad “lighter mobile render profile” work alone to a more specific versus-mirror optimization pass.
- Constrained phone-sized live versus now prioritizes gameplay framerate over full peer-arena fidelity.

## Why
- The likely regression point was narrowed further: the full-arena live mirror introduced by versus was the most suspicious new render cost.
- A targeted fix on the live mirror gives a better framerate win than only shaving shared background visuals.

## Updated approach
- Keep full-detail peer rendering in spectate, where the mirror is the main event.
- On constrained narrow/short viewports during live play, render the peer ship/status only:
  - no live mirror enemy ghost field
  - no live mirror arena tint fill
  - redraw at snapshot cadence instead of extra in-between interpolation work
- Leave the shared render-profile cuts from the original plan in place.
