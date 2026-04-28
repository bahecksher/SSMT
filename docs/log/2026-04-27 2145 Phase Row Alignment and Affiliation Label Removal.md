# 2026-04-27 2145 Phase Row Alignment and Affiliation Label Removal

## TL;DR
- What changed: Kept `PHASE` on the same top row and responsive font size as `CREDITS // LIVES`, and removed the `WORKING WITH // XXX` label from under the pause button.
- Why: The header should read as one coherent line, and the extra affiliation label was adding clutter under the pause control.
- What didn't work: The first build after the layout change failed because `shieldRowY` was left over from the old two-row phase logic; removed it.
- Next: Browser-playtest the HUD at narrow widths and while pausing in Campaign to confirm the alignment feels right in motion.

---

## Full notes

- `src/game/ui/Hud.ts`
  - `PHASE` now reuses the active top-row font size chosen for the score/lives cluster.
  - Removed the fallback that dropped `PHASE` to the second row.
- `src/game/scenes/GameScene.ts`
  - Removed creation, update, and cleanup for the `WORKING WITH // XXX` status text under the pause button.
- Verification
  - `npm.cmd run build` passed.
