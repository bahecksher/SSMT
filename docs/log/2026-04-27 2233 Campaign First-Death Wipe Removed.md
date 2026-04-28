# 2026-04-27 2233 Campaign First-Death Wipe Removed

## TL;DR
- What changed: First-life campaign deaths no longer play the red screen wipe before the short respawn warp begins.
- Why: The wipe made the first death feel heavier and noisier than intended once the respawn was shortened.
- What didn't work: Nothing broke in build; this was a small death-transition branch cleanup.
- Next: Live-playtest a campaign death to confirm the no-wipe handoff into the 1-second gate respawn feels clean.

---

## Full notes

- `src/game/scenes/GameScene.ts`
  - The campaign soft-respawn branch now returns directly into `softRespawnForCampaign()` after death debris + ship hide + shake.
  - The red `Overlays.screenWipe()` path now only runs for full deaths that go to results.
- Verification
  - `npm.cmd run build` passed.
