# 2026-04-30 1756 Boss Crossing Path Speed Tuning

## TL;DR
- What changed: Regent gunship no longer hugs arena edges; it now crosses through arena center using the same pass structure as the Slag Hauler. Both current bosses also move faster.
- Why: the edge-hugging gunship made shield-ram hardpoint/core attacks too awkward compared with the newer center-crossing boss.
- What didn't work: no live browser feel pass was completed here; this is build-verified tuning.
- Next: jump to phase 10 several times, verify both bosses spawn, and test shield-ram windows at the new speeds.

---

## Full notes

Updated `src/game/entities/GunshipBoss.ts` so the gunship now:

- starts each pass offscreen on a random heading through arena center
- moves with `GUNSHIP_BOSS_BODY_SPEED`
- starts a new pass after leaving the arena overscan bounds
- orients its hull, guns, core, destruction fan, and hardpoint drop velocity from the travel heading
- projects beams along the ship's local inward axis to the arena boundary instead of relying on top/bottom/left/right edge cases
- checks beam collisions against the actual beam segment after the arbitrary-angle pathing change

Updated `src/game/data/tuning.ts`:

- `SLAG_HAULER_BODY_SPEED`: `38 -> 58`
- added `GUNSHIP_BOSS_BODY_SPEED = 74`
- removed unused gunship edge-pass duration / hull-offset tuning values

Verification:

- `npm.cmd run build` passes.

Risks / follow-up:

- The gunship beam geometry is now diagonal when the pass is diagonal. That matches the new arbitrary crossing path, but needs a live readability check.
- `GUNSHIP_BOSS_BODY_SPEED = 74` and `SLAG_HAULER_BODY_SPEED = 58` are first-pass feel values.
