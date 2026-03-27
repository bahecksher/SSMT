# 2026-03-27 1330 Salvage Proximity

## TL;DR
- What changed: Salvage now uses proximity-based scoring like asteroid mining instead of a flat payout anywhere inside the zone.
- Why: User wanted the same scoring-zone mechanic applied to salvage.
- What didn't work: Nothing functional failed; build passed after the tuning/system update.
- Next: Playtest the salvage min/max curve and see whether the edge payout still feels fair.

---

## Full notes

- Added salvage min/max point tuning values so salvage can scale by distance from the core.
- Updated `SalvageSystem` to calculate salvage payout with a quadratic proximity curve using the salvage kill radius as the inner high-value edge.
- Salvage floating text now pops faster/bolder when the player is hugging the salvage core, mirroring the asteroid mining feedback.
- Rare salvage still uses its multiplier on top of the new proximity scoring.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
