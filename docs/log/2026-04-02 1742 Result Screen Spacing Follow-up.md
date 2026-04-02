# 2026-04-02 1742 Result Screen Spacing Follow-up

## TL;DR
- What changed: Reduced the result-bar title sizing and tightened the death/extract layout so comm panels sit above the retry/menu buttons more reliably on tight mobile screens.
- Why: The `DESTROYED` text still felt oversized, and the result comm panel could cover `TAP TO RETRY`.
- What didn't work: No live phone playcheck happened in-session; this was verified by code inspection and build only.
- Next: Verify the death/extract screens on an actual phone-sized viewport and tune further if needed.

---

## Full notes

- Updated [src/game/scenes/GameScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/GameScene.ts) to shrink the result-bar height and title text, start mission results higher on tighter screens, and bias the pinned result comm position toward the space directly above the buttons.
- Verified with `npm.cmd run build`.
