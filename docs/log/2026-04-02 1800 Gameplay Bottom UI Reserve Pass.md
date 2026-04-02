# 2026-04-02 1800 Gameplay Bottom UI Reserve Pass

## TL;DR
- What changed: Increased the gameplay scene's bottom reserved UI space and moved mission pills toward the top of that lane so bottom comms can sit below the arena without overlapping it.
- Why: The user wanted bottom comms, but also wanted them to avoid covering any part of the arena.
- What didn't work: No live phone/desktop playcheck happened in-session; this pass was verified by build and code inspection only.
- Next: Verify on-device that the arena, mission pills, and bottom comm bar each read as separate layers with enough spacing.

---

## Full notes

- Updated [layout.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/layout.ts) so `setLayoutSize(...)` can accept gameplay-only top/bottom inset overrides.
- Updated [GameScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/GameScene.ts) so the gameplay scene reserves a larger bottom inset before building the arena and keeps comms pinned near the bottom of that reserved lane.
- Updated [Hud.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/ui/Hud.ts) so mission pills hug the top of the enlarged bottom gutter instead of centering themselves into the comm space.
- Verified with `npm.cmd run build`.
