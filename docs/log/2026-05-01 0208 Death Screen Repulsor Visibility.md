# 2026-05-01 0208 Death Screen Repulsor Visibility

## TL;DR
- What changed: Promoted active Versus repulsor/pulsar markers above the death-screen spectate mirror.
- Why: The dead player needs to see where the spectator-fired pulsar is arming and hitting.
- What didn't work: No blocker.
- Next: Run a two-window death/spectate check and confirm the marker is visible without covering controls.

---

## Full notes

Changed `src/game/scenes/GameScene.ts`.

The repulsor charge graphic was already spawned locally when a spectator tapped the peer arena, but it stayed at normal gameplay depth (`8`). During the death/spectate screen, the mirror backing and peer arena render at depths around `204-211`, so the charge marker was hidden underneath.

Added `refreshRepulsorChargeDepths()`:
- normal live play keeps charges at depth `8`.
- spectate mode promotes charges to just above the mirror entity layer.

The helper runs when:
- a new incoming/spectator repulsor is spawned.
- spectate begins.
- spectate ends.

Verification:
- `npm.cmd run build` passes.
