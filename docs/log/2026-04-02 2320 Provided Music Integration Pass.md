# 2026-04-02 2320 Provided Music Integration Pass

## TL;DR
- What changed: Replaced the old music set with the provided WAV soundtrack and rewired the shared music manager for menu, mission, gameplay, pause, and result states.
- Why: The user supplied the actual music exports and clarified the desired layering and transition behavior.
- What didn't work: Nothing blocked the implementation, but the late-game takeover point is still a feel-based phase-6 assumption pending playtesting.
- Next: Playcheck the new fades and decide whether the full-track swap should stay at phase 6 or shift later.

---

## Full notes

- Copied the provided WAV files into `public/audio/` with stable asset names for the game build.
- Rebuilt `src/game/systems/MusicSystem.ts` around five looping layer tracks: `Menu Synth`, `Bass 1`, `Drums 3`, `Bass 3`, and `Synth 3`.
- Added support for two exclusive late-game loops, `Full Phase 1` and `Full Phase 2`, with one chosen at random once the run reaches phase 6.
- Menu now uses `Menu Synth`; MissionSelect uses `Menu Synth` plus `Bass 1`.
- Gameplay now uses `Drums 3` at phase 1, adds `Bass 3` at phase 2, adds `Synth 3` at phase 4, and hands off to the selected full track at phase 6+.
- Pause now fades to the menu synth and restores the current gameplay phase mix on unpause.
- Death and extraction now fade to the menu synth before showing the destroyed or extract result UI.
- Verified with `npm.cmd run build`.
