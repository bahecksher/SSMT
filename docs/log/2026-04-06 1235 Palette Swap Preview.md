# 2026-04-06 1235 Palette Swap Preview

## TL;DR
- What changed: Added a saved palette system with `GREEN` / `ORANGE` / `BLUE` / `RED`, plus palette cycle controls in the main menu settings panel and the in-run pause menu
- Why: To let us audition different overall color voices, especially warm/cool background directions, without committing to a single palette yet
- What didn't work: The settings UI is still duplicated across scenes, so I kept this pass targeted instead of turning it into a larger shared-settings refactor
- Next: Playtest the four palettes, pick the strongest direction, then tune any remaining contrast misses or extend the control to MissionSelect later if we want it there too

---

## Full notes

- Added `paletteId` to saved settings and bumped the local settings version so existing saves pick up the new field cleanly
- Introduced shared palette definitions in the core color constants and applied the saved palette on boot and on scene create
- Main menu settings now includes a palette cycle button; changing palette restarts the menu with background handoff and reopens settings so comparison stays quick
- Pause menu now includes a palette cycle button; changing palette live-refreshes the starfield, arena border, HUD, pause chrome, and theme-sensitive gameplay colors without dropping the run
- Updated several previously hard-coded colors to follow the active palette: enemy ships, NPCs, shield visuals, bomb visuals, HUD text, starfield background, and Regent/Slick comm styling
- `npm.cmd run build` passes
