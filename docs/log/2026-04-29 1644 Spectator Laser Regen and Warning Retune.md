# 2026-04-29 1644 Spectator Laser Regen and Warning Retune

## TL;DR
- What changed: spectator sabotage laser charges now regenerate every 5 seconds instead of 15, and the sabotage laser warning telegraph was shortened from 1500ms back to 900ms.
- Why: user feedback was that spectating still felt too passive and that the sabotage laser warning lingered too long.
- What didn't work: no live two-window feel pass yet; this is build-verified only.
- Next: play a live versus session and see whether 5s regen is exciting or oppressive, and whether the 900ms warning still feels readable.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

Tuning changes in `src/game/data/tuning.ts`:

- `SPECTATE_LASER_REGEN_MS`: `15000` -> `5000`
- `VERSUS_LASER_WARNING_MS`: `1500` -> `900`

Not changed:

- `VERSUS_LASER_LETHAL_MS` stays `500`
- `SPECTATE_LASER_MAX_CHARGES` stays `3`
- pickup drop rates stay `8%` / `4%`

Intent:

- Dead/extracted players should get to interact meaningfully instead of waiting too long between shots.
- The sabotage beam should get back to a snappier dodge/read window after the earlier warning bump proved too passive for current feel.

Files changed:

- `src/game/data/tuning.ts`
- `docs/state.md`
- `docs/log/2026-04-29 1644 Spectator Laser Regen and Warning Retune.md`

Verification:

- `npm.cmd run build`
