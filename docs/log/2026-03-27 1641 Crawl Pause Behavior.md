# 2026-03-27 1641 Crawl Pause Behavior

## TL;DR
- What changed: Replaced the hard pause and resume countdown with an ultra-slow simulated pause where danger still exists.
- Why: The user wanted a more arcade-like pause that still allows death through collision, without making slow-motion a viable way to play.
- What didn't work: Nothing blocking; build passed. The exact crawl-speed feel still needs playtesting.
- Next: Playtest whether the slowdown is slow enough to discourage play while still preserving tension.

---

## Full notes

This session revised `docs/plans/2026-03-27 1626 Plan revision - Pause Feature.md` with `docs/plans/2026-03-27 1638 Plan revision - Pause Feature.md`.

Changed pause behavior substantially:
- removed the dedicated resume-countdown state and overlay
- removed the `3 2 1 GO` resume flow
- changed pause to an extreme crawl-speed simulation state
- disabled player control while paused
- kept hazard movement, timers, and collision risk alive at the slowed rate
- kept the existing abandon-to-menu flow

Verification:
- `npm.cmd run build`
