# 2026-04-07 0123 Campaign HUD Lives Match Credits

## TL;DR
- What changed: restyled the campaign `LIVES` tag above the arena to match the `CREDITS` line
- Why: the previous smaller UI-font treatment made the lives readout feel disconnected from the main top-line HUD
- What didn't work: nothing blocked this pass
- Next: check the combined `CREDITS // LIVES` line with large values to make sure it still fits comfortably on smaller screens

---

## Full notes

- Updated `src/game/ui/Hud.ts` so the campaign lives readout now uses the same title-font styling and salvage-color treatment as the credits line.
- Aligned the lives text vertically with the credit counter instead of keeping the slightly offset smaller-label presentation.
- Left the lives tag campaign-only; arcade still keeps the simpler credits-only top-left HUD.
- Verified with `npm.cmd run build`.
