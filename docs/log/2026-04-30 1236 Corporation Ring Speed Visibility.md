# 2026-04-30 1236 Corporation Ring Speed Visibility

## TL;DR
- What changed: nudged the corp leaderboard ring animation speeds upward.
- Why: the globe was visible after the last tweak, but the orbit rings and company score ring still read as static.
- What didn't work: no live menu visual pass was run in this session.
- Next: verify the rings visibly drift without becoming distracting.

---

## Full notes

- Increased `GLOBE_ORBIT_RATE` from `0.000075` to `0.00012`.
- Increased `CHART_RING_SPIN_RATE` from `0.000018` to `0.000032`.
- Left `GLOBE_SPIN_RATE` unchanged.
- `npm.cmd run build` passes.
