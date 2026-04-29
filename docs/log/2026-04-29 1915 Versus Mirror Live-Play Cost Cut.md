# 2026-04-29 1915 Versus Mirror Live-Play Cost Cut

## TL;DR
- What changed: Tightened the suspected versus-specific hotspot directly. On constrained narrow/short phone-sized viewports, live versus no longer draws the peer enemy ghost field or the live mirror backdrop tint, and the live mirror redraw cadence now matches snapshot cadence (`100ms`). Full-detail spectate remains intact.
- Why: After reviewing the regression, the strongest likely culprit was not generic networking but the full-arena live mirror added by versus. This pass cuts that path specifically.
- What didn't work: Nothing blocked implementation after the earlier constrained-render profile work; `npm.cmd run build` stayed green after the targeted mirror change.
- Next: Live phone check of normal versus gameplay and spectate to confirm this removes the chug without making the live mirror feel too stripped down.

---

## Full notes

This is a follow-up to `docs/log/2026-04-29 1909 Mobile Framerate Prioritization.md`. The earlier pass lowered shared render cost broadly, but the user pointed back at the versus regression specifically, so this session narrowed the fix onto the live mirror.

### What changed in code

`src/game/data/renderTuning.ts` now also controls live-mirror behavior:

- `mirrorLiveBgAlpha`
- `mirrorLiveRenderEnemies`
- constrained `mirrorRenderFrameMs` increased from `50` to `100`

Constrained live-versus profile now means:

- no live mirror arena tint fill
- no live mirror enemy ghost field
- redraw once per snapshot interval instead of doing extra redraws between packets

`src/game/scenes/GameScene.ts` now respects that profile:

- `drawMirrorBg()` chooses live-vs-spectate mirror alpha from the render profile
- `updateMirrorBackdrop()` skips enemy rendering during constrained live play, but still renders the peer ship and status label
- `beginVersusSpectate()` / `endVersusSpectate()` force the mirror background to redraw when switching modes so spectate still gets the expected backdrop treatment

### Intended result

During live play on constrained phones, the opponent still exists as a live status/ship presence, but the game no longer pays to repaint a second full enemy field behind the local arena. When the player dies/extracts and enters spectate, the richer mirror comes back because that view is now the focus.

### Verification

`npm.cmd run build` passes.

### Risks / follow-up

- The live mirror is intentionally less informative on constrained phones now. If this feels too stripped down, the next compromise would be to reintroduce only 1-2 nearest peer enemies instead of the full ghost field.
- Desktop / larger screens still use the richer live mirror path; only constrained narrow/short viewports take the cut.
