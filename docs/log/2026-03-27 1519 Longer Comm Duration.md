# 2026-03-27 1519 Longer Comm Duration

## TL;DR
- What changed: Increased the default visible duration for both Slick and Regent comm overlays.
- Why: User wanted more time to read the lines comfortably.
- What didn't work: Nothing blocked; build passed after the timing adjustment.
- Next: Playtest whether the longer hold time ever causes too much overlap with rapid event callouts.

---

## Full notes

- Increased Slick's default auto-hide duration from 3200ms to 4200ms.
- Increased Regent's default auto-hide duration from 3600ms to 4600ms.
- Left death-screen pinned comms unchanged because they already stay visible until reset.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
