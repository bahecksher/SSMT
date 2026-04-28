# 2026-04-27 2227 Campaign Death Ship Hide

## TL;DR
- What changed: The player ship now disappears immediately after death instead of remaining visible on the board during the first-life campaign death transition.
- Why: Leaving the destroyed ship visible during the respawn handoff was visually confusing.
- What didn't work: Nothing broke in build; this was a small visibility-only fix.
- Next: Live-playtest a campaign death to confirm the disappearance reads cleanly with the debris burst and short warp-in respawn.

---

## Full notes

- `src/game/scenes/GameScene.ts`
  - After spawning player debris and marking the ship destroyed, the player graphic alpha is now set to `0`.
  - Respawn flow still restores the ship via the existing `player.respawn()` path.
- Verification
  - `npm.cmd run build` passed.
