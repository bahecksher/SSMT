# 2026-05-01 0021 Wormhole Boundary Readability

## TL;DR
- What changed: Made the wormhole pocket boundary read more clearly by darkening/strengthening the danger exterior and cleaning visual detail out of the safe interior.
- Why: The safe circle and outside danger zone were not visually distinct enough during phone play.
- What didn't work: No live phone visual pass was run in this session; only build verification.
- Next: Test pocket mode on a phone-sized viewport and confirm the safe interior is easy to parse while the outside reads as danger.

---

## Full notes

- Increased the exterior boundary fill alpha in `drawPocketBoundary()`.
- Moved secondary boundary rings outside the safe circle.
- Moved rotating tick marks outside the safe circle instead of drawing them inward across the playable interior.
- Build verification passed with `npm.cmd run build`.
