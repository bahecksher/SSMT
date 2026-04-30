# 2026-04-29 2129 Tutorial Shield Comms Copy

## TL;DR
- What changed: tightened the SHIELDS tutorial Slick lines so they explicitly say enemy first, asteroid second, including a warning not to spend the first shield on the asteroid.
- Why: user flagged that the comm language could still read like the asteroid should be hit first.
- What didn't work: the prior copy was directionally correct but still soft enough to be misread during play.
- Next: quick in-browser tutorial pass to confirm the stronger wording reads cleanly at gameplay pace.

---

## Full notes

- Updated `tutShield`, `tutShieldNudge`, `tutShieldHit`, and `tutShieldDone` in `src/game/data/slickLines.ts`.
- Copy now explicitly states:
  - first shield is for the enemy
  - do not spend that first shield on the asteroid
  - second shield is for splitting the asteroid
- `npm.cmd run build` passes after the copy update.
