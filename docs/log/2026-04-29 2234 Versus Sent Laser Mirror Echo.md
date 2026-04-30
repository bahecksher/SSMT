# 2026-04-29 2234 Versus Sent Laser Mirror Echo

## TL;DR
- What changed: Added an immediate local mirror echo for versus lasers fired at the opponent, covering both pickup-fired and spectate-fired lasers.
- Why: The player wanted to see the lasers on their own screen that fire on the opponent's screen, without waiting for the opponent's next snapshot to make the lane visible.
- What didn't work: N/A. Build passed after implementation.
- Next: Two-window playtest to confirm the echo lines up visually with the opponent-side strike and does not feel duplicated when the snapshot arrives.

---

## Full notes

Revises `docs/plans/2026-04-29 2224 Plan - Versus Mirror Environment Detail.md`.

`src/game/scenes/GameScene.ts`:

- Added `MirrorLaserEcho` state for local-only sent laser feedback.
- `fireVersusLaser()` now adds a mirror echo as soon as the local player fires a pickup-triggered laser.
- `fireSpectateLaser()` now does the same for spectator lane-button lasers.
- `tickMirrorLaserEchoes()` advances the warning/lethal timing using the existing `VERSUS_LASER_WARNING_MS` and `VERSUS_LASER_LETHAL_MS` constants.
- `reconcileMirrorLaserEchoes()` removes local echoes once a peer snapshot reports the matching versus lane.
- `updateMirrorBackdrop()` now draws snapshot lasers plus any active local laser echoes.

Verification:

- `npm.cmd run build` passes.

Risk:

- Not manually two-window verified yet. If both echo and peer snapshot overlap for a fraction of a second, the line may briefly look brighter; the reconciliation should keep that small.
