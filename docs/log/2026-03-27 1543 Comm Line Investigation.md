# 2026-03-27 1543 Comm Line Investigation

## TL;DR
- What changed: Investigated Slick/Regent dialogue loading and usage without changing gameplay code.
- Why: Recent direct edits to the dialogue files did not appear to show up in-game.
- What didn't work: There was no stale duplicate source file or unsaved diff to explain the mismatch.
- Next: If needed, wire additional Slick line buckets into actual events or rebuild/restart the running app if an older bundle is still open.

---

## Full notes

- `src/game/data/slickLines.ts` and `src/game/data/regentLines.ts` both contain the current edited text on disk.
- `GameScene` imports those files directly; there is not a second source-of-truth for dialogue content.
- Only some Slick keys are currently used in gameplay: `runStart`, `gateOpen`, `gateClose`, and `hazardDeath`.
- Slick keys present in the file but currently unused by `GameScene`: `menuIntro`, `phaseAdvance`, `shieldPickup`, `extraction`, `death`, and `gameOverRetry`.
- Regent keys are all wired, but some are phase- or cause-dependent, so they may not appear during a short playtest.
- `dist/` also contains the same current strings, so the built bundle on disk matches the source files.
