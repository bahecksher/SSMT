# 2026-04-02 2349 Reverted Menu First-Tap Audio Workaround

## TL;DR
- What changed: Removed the first-tap menu hold workaround and restored the original single background tap flow into MissionSelect.
- Why: The user explicitly disliked the extra-tap behavior.
- What didn't work: This does not remove browser autoplay restrictions on fresh sessions.
- Next: Decide whether to accept browser-policy limits or change the boot/menu UX in a different way.

---

## Full notes

- Updated `src/game/systems/MusicSystem.ts` to remove the temporary initial-tap consumption helper.
- Updated `src/game/scenes/MenuScene.ts` to restore the original menu background tap behavior.
- Verified with `npm.cmd run build`.
