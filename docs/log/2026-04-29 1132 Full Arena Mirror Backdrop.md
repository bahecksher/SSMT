# 2026-04-29 1132 Full Arena Mirror Backdrop

## TL;DR
- What changed: Moved the versus peer mirror from the bottom-right PIP into a full-arena ghost backdrop behind local gameplay, kept the existing snapshot interpolation / result flow / rematch behavior, and re-ran the production build.
- Why: User wanted the mirrored viewport to match the player's arena size and live behind it instead of reading as a separate inset panel.
- What didn't work: The original `updateMirrorViewport` path had a stale encoded placeholder string that made a direct surgical rewrite awkward. Kept the legacy method as a thin wrapper and routed the active path through a clean full-arena updater instead.
- Next: Human two-window playtest to judge readability and determine whether the bigger mirror needs opacity or label tuning before stable enemy IDs.

---

## Full notes

### Layout change

The peer mirror now:

- uses `layout.arenaLeft/Top/Width/Height` as its render bounds
- sits below local gameplay via low render depths
- keeps the same snapshot interpolation and scoreboard label behavior
- still hides on `RESULTS`

Instead of a framed mini-window, the peer feed is now a low-alpha backdrop across the whole arena with a subtle `P2` label and waiting state.

### Styling

To keep the larger mirror from overwhelming local play:

- mirror background fill is very light
- peer enemies are faint filled/stroked dots
- peer ship is a low-alpha triangle outline/fill with a softer shield ring
- mirror text alpha is reduced and anchored near the arena's top-left

### Build verify

Ran:

```bash
npm.cmd run build
```

Result: success. TypeScript passed and Vite produced a production build without errors.

### Files touched

Modified:
- `src/game/scenes/GameScene.ts` — full-arena mirror placement, lower mirror depths, palette refresh hook, new live updater path.
- `docs/state.md`

Added:
- `docs/plans/2026-04-29 1132 Plan revision - Mirrored Versus Full Arena Mirror.md`
- `docs/log/2026-04-29 1132 Full Arena Mirror Backdrop.md`
