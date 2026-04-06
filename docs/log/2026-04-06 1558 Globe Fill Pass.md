# 2026-04-06 1558 Globe Fill Pass

## TL;DR
- What changed: added a filled red planet body behind Tortuga's wireframe
- Why: the user wanted the planet filled in so it reads as a more solid presence
- What didn't work: nothing major; the important detail was inserting the fill between the back-half ring pass and the wireframe/front ring pass
- Next: playtest the globe and confirm the fill strength feels right rather than too muddy or too faint

---

## Full notes

Updated `GeoSphere` to draw a low-alpha `COLORS.NPC` fill circle for the planet body after the back ring/debris pass and before the wireframe edges/front ring. This preserves the orbital ring layering while giving Tortuga a more substantial filled silhouette.
