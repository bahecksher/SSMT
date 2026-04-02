# 2026-04-02 1740 Mobile HUD Cleanup Pass

## TL;DR
- What changed: Reduced compact-phone top HUD text and active mission pill text, and replaced the results title treatment with full-width red/green status bars.
- Why: Mobile UI text above and below the arena was reading too large, and the death/extract screens needed a stronger state banner.
- What didn't work: No live phone viewport playcheck happened in-session; this pass was verified by build and code review only.
- Next: Do a real phone-sized sweep and tune any remaining oversized or cramped text.

---

## Full notes

- Updated [src/game/ui/Hud.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/ui/Hud.ts) so compact-width viewports use smaller top-gutter text and smaller mission-pill label/progress text without shrinking the pill cards themselves.
- Updated [src/game/scenes/GameScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/GameScene.ts) so results now render a full-width `DESTROYED` or `EXTRACT` bar across the screen instead of the old floating title text.
- Verified with `npm.cmd run build`.
