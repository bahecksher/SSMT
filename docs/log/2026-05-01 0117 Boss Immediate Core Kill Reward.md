# 2026-05-01 0117 Boss Immediate Core Kill Reward

## TL;DR
- What changed: Bosses now die immediately when the shielded player hits the exposed core device, and boss death drops a large reward pickup.
- Why: The previous enter-then-exit breach made boss death feel delayed, and killing a boss needed a bigger payoff.
- What didn't work: No live boss pass was run in this session; only build verification.
- Next: Use `Shift+0` to expose a boss core, shield-ram the device, and confirm immediate death plus the reward pickup.

---

## Full notes

- Changed `GunshipBoss.updateCoreBreach()` to return destroyed immediately on shielded inner-core/device contact.
- Changed `SlagHauler.updateCoreBreach()` the same way.
- Added `BOSS_DEFEAT_BONUS_POINTS = 2_500` in `src/game/data/tuning.ts`.
- `DifficultySystem.handleBossDestroyed()` now queues a bonus pickup at the boss center using that value.
- Existing shield consumption in `GameScene` remains in place, so core kills still spend a shield.
- Build verification passed with `npm.cmd run build`.
