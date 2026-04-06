# 2026-04-06 1311 Pause Button Center Slot Pass

## TL;DR
- What changed: Removed the HUD phase readout and moved the existing pause button into the centered top slot above the arena.
- Why: The user wanted the pause control to replace the `PHASE` label and sit in the visual center of the HUD.
- What didn't work: The first build caught one leftover unused HUD field from the removed phase label; cleaned it up immediately.
- Next: Playtest the centered pause button on compact screens and decide whether the size or label needs a taste pass.

---

## Full notes

- Removed the `phaseText` display from `src/game/ui/Hud.ts` while leaving the rest of the HUD intact.
- Repositioned the existing gameplay pause button in `src/game/scenes/GameScene.ts` from the top-right corner to the center-top HUD slot.
- Kept the same pause/resume behavior, state-driven visibility, and button styling logic so only the placement changed.
- Verified with `npm.cmd run build`.
