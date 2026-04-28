# 2026-04-27 2238 Corporation Graph Debris Fill

## TL;DR
- What changed: Thinned the `CORPS` leaderboard donut chart and filled each corp slice with arena-style debris so it echoes the Tortuga background ring.
- Why: The chart needed to feel lighter and visually tie back to the same debris language used in the playfield.
- What didn't work: No browser playtest yet, so debris density and readability are only build-verified right now.
- Next: Open the menu in `ARCADE` and check the `CORPS` view on narrow and desktop layouts to make sure the texture reads clearly without overpowering the leaderboard rows.

---

## Full notes

- Increased the donut hole so the score ring is a little thinner around the center globe.
- Replaced the mostly flat translucent slice fill with a deterministic debris pass made of pale dust dots, shard polygons, and a few light company-colored accents.
- Kept the existing outer/inner arc strokes and center Tortuga globe so the chart still reads as the same component, just closer to the arena's visual language.
- `npm.cmd run build` passes after the chart update.
