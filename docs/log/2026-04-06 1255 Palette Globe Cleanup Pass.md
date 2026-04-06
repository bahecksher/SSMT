# 2026-04-06 1255 Palette Globe Cleanup Pass

## TL;DR
- What changed: Removed the globe landmass overlay and kept the cleaner wireframe globe with the enemy-color palette thread
- Why: The continent breakup experiment was visually noisy and did not read well in practice
- What didn't work: The added landmasses did not improve the globe enough to justify the extra detail
- Next: Keep testing the cleaner globe against the black-space / colored-frame direction and tune other background elements instead if needed

---

## Full notes

- Removed the continent blob rendering from `src/game/entities/GeoSphere.ts`
- Left the globe color tied to the enemy-side palette thread from the prior pass
- The globe is back to a simpler rotating wireframe treatment
- `npm.cmd run build` passes
