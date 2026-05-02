# 2026-05-01 2031 Direct Versus Deploy

## TL;DR
- What changed: Versus now launches directly from the room countdown into `GameScene`, bypassing MissionSelect.
- Why: User wanted the simplest possible Versus: no missions, no company flight, just player-vs-player score/extract competition.
- What didn't work: 3-4 player runtime remains blocked until GameScene state becomes multi-peer-safe.
- Next: Add sender ids and map-based peer state in GameScene.

---

## Full notes

Changes made:

- Updated `MenuScene.fireVersusMatchStart()` to start `SCENE_KEYS.GAME` instead of `SCENE_KEYS.MISSION_SELECT`.
- Kept the existing multiplayer handoff and mode `RunMode.VERSUS`.
- Updated `GameScene` so Versus always creates an empty `MissionSystem`, regardless of persisted accepted missions.
- Updated `GameScene` so Versus skips company affiliation liaison setup. Company run boosts were already disabled for Versus.
- Updated the active four-player Versus plan and decision log to record direct deploy/no-company/no-mission direction.

Verification:

- `npm.cmd run build` passes.

Notes:

- MissionSelect still has old Versus-specific code, but the current active route no longer enters it.
- The next expansion step is no longer briefing readiness; it is making the runtime network events and peer state support multiple sender ids.
