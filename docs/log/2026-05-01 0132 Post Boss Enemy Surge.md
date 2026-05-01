# 2026-05-01 0132 Post Boss Enemy Surge

## TL;DR
- What changed: Added a red enemy surge after boss death.
- Why: Beating a boss should become a high-pressure extraction moment instead of a calm cleanup phase.
- What didn't work: No live post-boss playtest was run in this session; only build verification.
- Next: Kill a boss and confirm the enemy wave feels like "grab loot and extract now" pressure.

---

## Full notes

- Added post-boss surge tuning constants:
  - `POST_BOSS_ENEMY_SURGE_INITIAL_COUNT = 4`
  - `POST_BOSS_ENEMY_SURGE_INTERVAL_MS = 1_800`
  - `POST_BOSS_ENEMY_SURGE_MAX_ENEMIES = 10`
- `DifficultySystem.handleBossDestroyed()` now starts the surge after boss cleanup/reward spawning.
- The surge uses existing `EnemyShip` behavior so enemies remain normal red attackers.
- The surge resets on debug phase changes.
- Build verification passed with `npm.cmd run build`.
