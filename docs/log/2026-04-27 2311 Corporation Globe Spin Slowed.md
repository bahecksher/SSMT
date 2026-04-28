# 2026-04-27 2311 Corporation Globe Spin Slowed

## TL;DR
- What changed: reduced the `CORPS` leaderboard Tortuga globe spin rate to match the arena backdrop planet's much slower rotation.
- Why: the menu globe was spinning noticeably faster than the in-arena planet, which made the leaderboard center feel too busy.
- What didn't work: no live browser check yet, so this pass is build-verified only.
- Next: browser-playtest the `ARCADE -> CORPS` menu view and confirm the slower center globe still feels alive without drawing too much attention.

---

## Full notes

- Matched `src/game/ui/CorporationScoreGraph.ts` globe rotation to the same effective drift used by the arena `GeoSphere`, leaving the debris ring animation untouched.
- Ran `npm.cmd run build` successfully after the change.
