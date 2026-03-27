# 2026-03-27 1438 Asteroid Mining Signals

## TL;DR
- What changed: Asteroids only grant mining if they visibly show the orange mining ring, and the share of mineable asteroids was reduced.
- Why: User wanted the visual telegraph and gameplay rule to match, with fewer mineable asteroids overall.
- What didn't work: Nothing blocked; build passed after wiring mining eligibility into spawn, rendering, and scoring.
- Next: Playtest whether the new mineable density feels fair or needs another pass.

---

## Full notes

- Added a drifter-level `isMineable` flag so mining visuals and mining scoring now use the same source of truth.
- Unringed asteroids remain fully red hazards and can still collide, split, and be destroyed, but they no longer pay out mining score.
- Set mineable asteroid spawn share to 35% via tuning so ringed asteroids are noticeably rarer without removing the mechanic.
- Preserved mineable state through asteroid splitting/shield destruction so fragments stay visually and mechanically consistent with the parent.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
