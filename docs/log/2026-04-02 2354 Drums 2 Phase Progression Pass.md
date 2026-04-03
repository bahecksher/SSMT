# 2026-04-02 2354 Drums 2 Phase Progression Pass

## TL;DR
- What changed: added `drums-2.wav`, made MissionSelect `Bass 1` only, and rewired gameplay music to the new phase 1-5 progression.
- Why: the user supplied a new early drum stem and clarified the exact desired soundtrack buildup.
- What didn't work: the existing threshold-based mix no longer matched the requested structure, so it was replaced with explicit phase mixes.
- Next: playcheck the phase transitions in-game and rebalance any layer volumes if the handoffs feel abrupt.

---

## Full notes

Updated `MusicSystem.ts` so the layered track set now includes both `Drums 2` and `Drums 3`, with `Bass 1` reused across MissionSelect and the early gameplay phases. MissionSelect now plays only `Bass 1`, phase 1 is bass-only, phase 2 adds `Drums 2`, phase 3 adds `Synth 3`, phase 4 swaps to the late gameplay trio `Bass 3 + Drums 3 + Synth 3`, and phase 5+ still chooses one full track loop for the rest of the run.

Copied the new `Drums 2.wav` source into `public/audio/drums-2.wav` so it ships with the rest of the provided soundtrack assets. Verified the current worktree with `npm.cmd run build`, which passed after the music-system patch.
