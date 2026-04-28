# 2026-04-27 2149 Campaign Respawn Warp-In

## TL;DR
- What changed: Campaign second lives now restart with the same warp-in gate and countdown sequence used at the beginning of a run.
- Why: The previous soft-respawn dropped the player straight back into gameplay, which felt inconsistent with the opening spawn language.
- What didn't work: Nothing broke in code, but the old respawn path had to stop spawning debris immediately because the reused `GO` board wipe now handles the fresh board reset.
- Next: Browser-playtest a life-loss in Campaign and confirm the timing feels good at both early and late phases.

---

## Full notes

- `src/game/scenes/GameScene.ts`
  - Added `startWarpInAt()` to centralize gate + countdown setup.
  - Fresh runs and campaign soft-respawns now both call that helper.
  - Soft-respawn now seeds `invulnerableTimer = 2000` to match the fresh-run opening grace more closely.
- Verification
  - `npm.cmd run build` passed.
