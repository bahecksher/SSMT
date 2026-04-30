# 2026-04-30 1219 Versus Spectate Control Strip

## TL;DR
- What changed: reduced repulsor radius and moved spectate laser/repulsor availability into a dedicated button strip below the arena.
- Why: the repulsor felt a little too wide, and the disruption UI was sitting over gameplay/status elements.
- What didn't work: no live two-window compact-mobile visual pass was run in this session.
- Next: verify the bottom strip layout and tune the repulsor radius/force in a real match.

---

## Full notes

- Changed `SPECTATE_REPULSOR_RADIUS` from `92` to `72`.
- Removed the six arena-edge spectate laser lane buttons.
- Added a bottom-gutter `LASER` button showing charges/regen; pressing it fires one random lane.
- Added a bottom-gutter `REPULSOR` availability button showing ready/cooldown and instructing the spectator to tap the arena.
- Moved the spectate waiting `MENU` button into the top header so the bottom gutter is reserved for disruption controls.
- `npm.cmd run build` passes.
