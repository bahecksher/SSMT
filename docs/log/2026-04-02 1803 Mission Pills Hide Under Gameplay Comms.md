# 2026-04-02 1803 Mission Pills Hide Under Gameplay Comms

## TL;DR
- What changed: Active mission pills now hide while a gameplay comm is visible.
- Why: The user wanted the comm channel to cover the active mission tracking at the bottom.
- What didn't work: The first build caught a small HUD typing issue around visibility toggling, which was then fixed.
- Next: Visually check the handoff between comm-visible and comm-cleared states on-device.

---

## Full notes

- Updated [Hud.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/ui/Hud.ts) with a mission-pill visibility helper so the active mission HUD can be hidden independently of its render/update logic.
- Updated [GameScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/GameScene.ts) so active mission tracking hides whenever a gameplay comm is currently visible, then returns once the comm channel clears.
- Verified with `npm.cmd run build`.
