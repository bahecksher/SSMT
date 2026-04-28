# 2026-04-28 0255 Tutorial Entry Gate Startup

## TL;DR
- What changed: `TutorialArenaScene` now opens with the same gate-led intro cadence as the live game, but with no countdown text. The player spawns inside a closing gate, input stays locked during the intro, and the MOVE section only starts once that gate preview finishes. This pass also repaired stale tutorial HUD references so the scene builds again.
- Why: user asked for the tutorial arena to start the same way the main game starts, minus the countdown copy, and the current scene had a broken half-swapped HUD implementation blocking builds.
- What didn't work: the previous in-progress tutorial file mixed the new compact HUD (`creditsText` / `shieldText`) with old removed text references (`SECTION_COPY`, `sectionText`, `scoreText`, etc.), so `npm.cmd run build` failed until that wiring was cleaned up.
- Next: browser-playtest the tutorial launch feel and make sure the gate-only intro plus restored objective line read cleanly on both desktop and phone-sized layouts.

---

## Full notes

### Files changed
- `src/game/scenes/TutorialArenaScene.ts`
- `docs/state.md`
- `docs/log/2026-04-28 0255 Tutorial Entry Gate Startup.md`

### What works
- Tutorial scene launch now mirrors the main game's opening gate behavior without rendering countdown text.
- Section 1 timing starts after the intro gate, so MOVE nudges and completion checks no longer tick while the player is frozen.
- Compact tutorial HUD now compiles and updates correctly with credits, shield state, current step, and objective copy.
- `npm.cmd run build` passes.

### What is still stubbed
- Tutorial opening feel is build-verified only; no browser playtest yet on the new gate-only intro.
- Section thresholds and Slick copy are still first-pass tuning values from the ongoing tutorial rework.

### Risks / follow-ups
- The new intro uses a full 4-second live-game-style gate preview. If `HOW TO PLAY` feels too slow on repeat visits, this duration may need tuning even if the behavior is correct.
- The restored top objective copy is a simple compact layout. It should be checked on narrow/mobile viewports to make sure it does not crowd the credits readout or BACK button.
