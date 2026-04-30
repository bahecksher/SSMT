# 2026-04-29 2240 Versus Laser Audio Match

## TL;DR
- What changed: Versus sabotage laser strikes now play the same `beamCharge` and `beamFire` SFX as regular laser hazards.
- Why: User wanted lasers sent in versus to use the same sound as regular lasers.
- What didn't work: N/A. Build passed after the change.
- Next: Two-window audio check to confirm the receiver hears the charge/fire cues at the expected moments and the mix feels right.

---

## Full notes

`src/game/entities/VersusLaserStrike.ts`:

- Imported `playSfx`.
- Stored the scene reference so the strike can trigger sounds during update.
- Plays `beamCharge` in the constructor with the same options as `BeamHazard`.
- Plays `beamFire` on the warning-to-lethal transition with the same options as `BeamHazard`.

Verification:

- `npm.cmd run build` passes.
