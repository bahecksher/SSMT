# 2026-04-02 2347 First-Boot Menu Audio Unlock Fix

## TL;DR
- What changed: The menu background tap now yields to the initial music unlock instead of immediately transitioning to MissionSelect on first boot.
- Why: The user reported that `Menu Synth` was not audible on first boot.
- What didn't work: Nothing blocked the fix.
- Next: Playcheck the first-load menu flow in a fresh browser session.

---

## Full notes

- Updated `src/game/systems/MusicSystem.ts` to expose a small helper for detecting the initial unlock window.
- Updated `src/game/scenes/MenuScene.ts` so the first background tap is consumed when the menu is still in its initial audio-unlock state.
- This keeps the user on the menu long enough for `Menu Synth` to start after the browser allows audio.
- Verified with `npm.cmd run build`.
