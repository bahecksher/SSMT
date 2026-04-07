# 2026-04-07 0108 Campaign HUD Lives Readout

## TL;DR
- What changed: added a campaign-only `LIVES` readout beside the credits above the arena
- Why: campaign state should be visible during gameplay without making the player infer remaining lives from menu screens only
- What didn't work: nothing blocked this pass
- Next: check whether the lives tag stays readable when credits get large on smaller screens

---

## Full notes

- Updated `src/game/ui/Hud.ts` to create a separate `livesText` element positioned beside the credits counter.
- Updated `src/game/scenes/GameScene.ts` to pass current campaign lives into the HUD during gameplay.
- The lives tag hides automatically in arcade mode, so the arcade HUD keeps its previous footprint.
- Verified with `npm.cmd run build`.
