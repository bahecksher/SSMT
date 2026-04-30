# 2026-04-30 1232 Corporation Globe Orbit Animation

## TL;DR
- What changed: slowed the corp leaderboard globe spin further and added orbiting rings around it.
- Why: the corp board should feel more alive without turning the center chart into visual noise.
- What didn't work: no live menu visual pass was run in this session.
- Next: verify the orbiting rings read well on compact and desktop menu layouts.

---

## Full notes

- Updated `src/game/ui/CorporationScoreGraph.ts`.
- Reduced the globe meridian spin rate to a very slow drift.
- Added two projected orbit rings that draw back-side segments behind the globe and front-side segments over it.
- Added small moving highlights on the front orbit paths.
- `npm.cmd run build` passes.
