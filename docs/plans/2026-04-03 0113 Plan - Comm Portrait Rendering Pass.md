# Plan - Comm Portrait Rendering Pass
_Created: 2026-04-03 0113_

## Goal
Refresh Slick, Regent, and all liaison portraits so they feel less like flat vector icons and more like layered Tron-style holo renders while staying compatible with the current comm and MissionSelect layouts.

## Approach
- Replace the simple outline portraits with layered holo portrait primitives such as glows, translucent face plates, visors, and scan bands.
- Give Slick a softer, more feminine silhouette without changing her role or UI footprint.
- Give Regent a sharper armored silhouette and give each liaison a distinct company-specific portrait silhouette.
- Keep the exported portrait factories usable in the menu, gameplay comms, results comms, and MissionSelect favor cards.
- Verify with a production build after the drawing pass.

## Scope boundaries
- No bitmap portrait pipeline or external image asset generation.
- No dialogue, voice, or company data changes.
- No comm layout rework unless the new portraits force it.

## Open questions
- The final art tuning still needs an eyeball pass on an actual phone-sized viewport to confirm the smallest favor-card portraits do not feel too busy.
