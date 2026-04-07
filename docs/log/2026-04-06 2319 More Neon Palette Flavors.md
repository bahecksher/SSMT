# 2026-04-06 2319 More Neon Palette Flavors

## TL;DR
- What changed: Added three new neon palette themes to the shared palette rotation: `VOLT`, `PULSE`, and `FROST`.
- Why: The original four palettes were feeling a little narrow for the game's hologram look, and the user asked for more neon flavor variety.
- What didn't work: This pass expands the colorways but does not add a separate bloom/glow rendering system.
- Next: Play through the new themes and decide whether any should be pushed even harder or whether a future subtle glow pass is still worth doing.

---

## Full notes

- Expanded `PALETTE_ORDER` and `PALETTE_LABELS` in `src/game/constants.ts` so the existing palette switchers automatically rotate through the new themes.
- Added three new full palette definitions:
  - `VOLT` for lime / cyan / magenta energy
  - `PULSE` for neon magenta with cool cyan highlights
  - `FROST` for icy cyan with cold neon contrast
- Kept the change scoped to palette data so menu, MissionSelect, and pause settings all inherit the new options automatically.
- Verified with `npm.cmd run build`.
