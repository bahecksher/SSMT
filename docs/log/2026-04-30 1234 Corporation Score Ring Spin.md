# 2026-04-30 1234 Corporation Score Ring Spin

## TL;DR
- What changed: added a slow spin to the corporation score ring.
- Why: the company arcs and debris should feel like a moving orbital layer, not static slices with dust sliding through them.
- What didn't work: no live menu visual pass was run in this session.
- Next: verify the combined globe, orbit rings, score ring, and debris motion feels alive without clutter.

---

## Full notes

- Added `CHART_RING_SPIN_RATE` in `CorporationScoreGraph`.
- The shared slice segment angle now includes `chartSpin`, so company arcs, markers, and debris rotate together.
- Redraws chart base/overlay each frame because those elements now animate.
- `npm.cmd run build` passes.
