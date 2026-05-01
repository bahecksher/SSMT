# 2026-05-01 0129 Boss Bonus Burst

## TL;DR
- What changed: Boss death now sprays many smaller bonus pickups instead of one large pickup.
- Why: A loot burst reads better than a single lonely reward after a boss kill.
- What didn't work: No live boss reward pass was run in this session; only build verification.
- Next: Use `Shift+0` to kill a boss and confirm the reward burst feels satisfying and collectible.

---

## Full notes

- Added `BOSS_DEFEAT_BONUS_PICKUP_COUNT = 12`.
- Kept total reward at `BOSS_DEFEAT_BONUS_POINTS = 2_500`.
- `DifficultySystem.handleBossDestroyed()` now splits the boss reward across 12 pickups, with the final pickup taking any rounding remainder.
- Pickups spawn around the boss center with radial offsets and outward velocity so they burst out with the debris.
- Build verification passed with `npm.cmd run build`.
