# 2026-04-06 1555 Globe Ring Visibility Correction Pass

## TL;DR
- What changed: pulled the Tortuga ring back from the literal 5x overscale into a large but visible footprint across the arena
- Why: the previous ring radii pushed the band completely outside the visible distance range of the current globe placement, so the ring effectively disappeared
- What didn't work: the literal 5x interpretation; with the globe origin tucked offscreen, that size put the ring off the playable view
- Next: visually verify whether this corrected scale is the right balance or whether it should come up or down one more notch

---

## Full notes

Adjusted `GeoSphere` ring radii down from the broken extreme values to a still-expanded visible range, and reduced the segment count from the overscale pass while keeping debris density high. The goal here was not to revert to the older smaller ring, but to land on a much bigger screen presence that actually intersects the arena again.
