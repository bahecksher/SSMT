# Plan - Palette Swap Preview
_Created: 2026-04-06 1235_

## Goal
Add a lightweight palette swap system so the game can preview green, orange, blue, and red theme directions from the main settings menu and the in-run pause menu.

## Approach
- Add a saved `paletteId` setting plus shared palette definitions that drive the existing `COLORS` object.
- Apply the saved palette on boot and scene create so Menu, MissionSelect, and Game all pick up the same look.
- Add palette cycle controls where requested, then refresh live gameplay visuals during pause so the current run is not lost while auditioning themes.

## Scope boundaries
- No full shared settings-panel extraction in this pass.
- No broader art overhaul beyond updating theme-sensitive colors for readability.
- No spec revision or economy/system design changes.

## Open questions
- Which palette direction has the strongest long-term identity after playtesting.
- Whether MissionSelect should also expose the palette cycle control or wait for a shared settings UI extraction.
