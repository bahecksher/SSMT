# 2026-04-02 2357 Mission Select Unlock Music Fix

## TL;DR
- What changed: switched the music unlock handoff from scene-local input listeners to Phaser's global sound-manager `unlocked` event.
- Why: the first tap from Menu into MissionSelect could shut down the old scene before the pending unlock callback fired, leaving the MissionSelect bass state unapplied.
- What didn't work: relying on scene input listeners for unlock timing was fragile across scene transitions.
- Next: spot-check a fresh browser session to confirm the first MissionSelect visit now brings in `Bass 1` reliably.

---

## Full notes

Updated `MusicSystem.ts` so pending music unlock now waits on `this.sound.on('unlocked')` semantics instead of wiring temporary `pointerdown` / `pointerup` / keyboard listeners to whichever scene happened to request music while audio was still locked. This keeps the latest requested music state alive across the Menu-to-MissionSelect scene handoff and applies it as soon as Phaser reports the sound manager is unlocked.

Verified with `npm.cmd run build`, which passed after the change.
