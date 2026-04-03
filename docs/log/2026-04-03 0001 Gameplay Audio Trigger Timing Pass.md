# 2026-04-03 0001 Gameplay Audio Trigger Timing Pass

## TL;DR
- What changed: NPC deaths now use the `Player Death` cue, the opening phase-1 board wipe now plays the bomb cue, and the first enemy warning SFX now fires on the phase 5 transition.
- Why: the user wanted stronger gameplay audio feedback around NPC kills, the initial arena clear, and enemy arrival.
- What didn't work: the old enemy warning timing waited for the first enemy to already exist on-screen, which was too late for the intended lead-in.
- Next: do a quick ear pass on NPC death frequency and the phase-5 warning timing.

---

## Full notes

Updated `GameScene.ts` in three places. First, NPC deaths now trigger `Player Death` both when the player shield-crashes into an NPC and when hazard-killed NPCs are consumed from `DifficultySystem`. Second, the opening countdown completion path now calls the shared board-wipe helper with the bomb cue enabled, so the initial phase-1 arena clear sounds like the rest of the wipe moments. Third, the `On first enemy appearance` SFX was moved off the first-spawn detection path and onto the phase transition into phase 5 so it lands before enemies are visible.

Verified with `npm.cmd run build`, which passed after the trigger retiming.
