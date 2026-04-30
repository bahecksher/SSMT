# 2026-04-30 1235 Corporation Globe Spin Visibility

## TL;DR
- What changed: increased the corp leaderboard globe spin rate from `0.0015 / 1000` to `0.006 / 1000`.
- Why: the prior "as slow as possible" value was too subtle to read as motion.
- What didn't work: no live menu visual pass was run in this session.
- Next: verify the globe reads as slowly moving without becoming visually busy.

---

## Full notes

- Updated `GLOBE_SPIN_RATE` in `src/game/ui/CorporationScoreGraph.ts`.
- Left the orbit rings and company score ring spin rates unchanged.
- `npm.cmd run build` passes.
