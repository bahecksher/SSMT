# 2026-04-07 0120 Mining Mission Asteroid Break Swap

## TL;DR
- What changed: replaced Deepcore's `HOLD UNBANKED` mission with `BREAK ASTEROIDS`, added real asteroid-break tracking, and filtered legacy hold-contract saves out of the mission pool
- Why: the old hold-credit objective felt dishonest because mission rewards still only pay on extraction, while asteroid breaks are a real mining accomplishment
- What didn't work: nothing blocked this pass
- Next: decide later whether collecting NPC/enemy bonus pickups deserves its own separate contract line

---

## Full notes

- Added `BREAK_ASTEROIDS` to the mission type set and changed the Deepcore secondary contract in `src/game/data/missionData.ts` to `BREAK {target} ASTEROIDS`.
- Updated mission brief copy and HUD shorthand so the new objective reads correctly across MissionSelect and gameplay.
- Added asteroid-break mission progress from two player-owned events: mining a mineable asteroid to depletion and smashing an asteroid with a shield.
- Stopped relying on the old unbanked-credit tracking path for this contract.
- Filtered saved mission cards through the current mission-type list so legacy `HOLD` cards quietly reroll into valid current contracts.
- Verified with `npm.cmd run build`.
