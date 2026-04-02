# 2026-04-02 1757 Gameplay Comm Bottom Anchor Pass

## TL;DR
- What changed: Moved gameplay comms to the bottom of the screen and made their positioning height-aware so wrapped messages stay pinned correctly.
- Why: The user preferred comms on the bottom while the arena is up instead of occupying the top HUD gutter.
- What didn't work: No live phone/desktop playcheck happened in-session; this pass was verified by build and code inspection only.
- Next: Trigger each gameplay comm type on a real viewport and tune the bottom offset only if the bar feels too high or too low.

---

## Full notes

- Updated [SlickComm.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/ui/SlickComm.ts), [RegentComm.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/ui/RegentComm.ts), and [LiaisonComm.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/ui/LiaisonComm.ts) with bottom-pinned layout support that repositions from the live panel height after text wrapping.
- Updated [GameScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/GameScene.ts) so gameplay comms use that bottom anchor, while result-state comms still switch back to the custom narrower pinned layout.
- Verified with `npm.cmd run build`.
