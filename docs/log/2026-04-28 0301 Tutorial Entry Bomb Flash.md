# 2026-04-28 0301 Tutorial Entry Bomb Flash

## TL;DR
- What changed: the tutorial intro gate now fires the same bomb SFX and white flash/shake effect used when a regular run starts.
- Why: user wanted the tutorial gate opening to match the regular game's startup punctuation, not just the gate timing.
- What didn't work: nothing blocked this pass after the prior tutorial-startup cleanup; this was a small follow-up on top of the new gate intro.
- Next: browser-playtest the launch feel and confirm the flash lands at the right moment relative to the gate opening and first Slick line.

---

## Full notes

### Files changed
- `src/game/scenes/TutorialArenaScene.ts`
- `docs/state.md`
- `docs/log/2026-04-28 0301 Tutorial Entry Bomb Flash.md`

### What works
- Tutorial startup now plays the same `bomb` cue and shared `Overlays.bombFlash()` effect the live game uses at run start.
- The tutorial still avoids the live game's board-wipe side effects; this pass adds the punctuation only, not entity clearing or salvage respawn behavior.
- `npm.cmd run build` passes.

### What is still stubbed
- No browser playtest yet on the timing/feel of the flash against the gate opening.

### Risks / follow-ups
- Because the tutorial uses the flash without the full board wipe, this is intentionally "same startup accent" rather than a literal call into `GameScene.boardWipe()`. If the user later wants exact one-for-one startup behavior, we may want to extract a shared helper for the effect chain.
