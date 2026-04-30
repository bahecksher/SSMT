# 2026-04-30 1657 Collapsing Pocket Boundary

## TL;DR
- What changed: added a visible circular wormhole-pocket boundary that shrinks over time and burns the player when they leave it.
- Why: the pocket loot storm needed a central danger hook that changes how the player moves, not only more asteroids and pickups.
- What didn't work: no live feel pass yet; boundary radius and burn grace are first-pass tuning.
- Next: test the boundary with `Shift+5` + `Shift+W`, then tune the end radius and burn timer.

---

## Full notes

1. Files created/changed
   - `src/game/data/tuning.ts`
   - `src/game/scenes/GameScene.ts`
   - `docs/state.md`
   - `docs/log/2026-04-30 1657 Collapsing Pocket Boundary.md`
2. What works
   - Pocket mode now draws a circular boundary centered on the arena.
   - The boundary radius interpolates from a wide starting circle to a small final circle over the pocket duration.
   - If the player is outside the boundary, the boundary flashes more aggressively and starts a short burn timer.
   - When the burn timer completes, it breaks a held shield or kills an exposed player.
   - Boundary visuals hide again when pocket mode exits.
   - `npm.cmd run build` passes.
3. What is still stubbed
   - No special pocket audio/music state yet.
   - No edge-biased pocket gate placement yet; gates still use the existing random gate placement.
4. Risks or follow-up recommendations
   - The final boundary radius may be too small or too generous depending on live asteroid density.
   - The burn timer may need tuning so leaving the ring feels dangerous without producing cheap deaths.
   - The boundary may want a stronger audio pulse or screen effect later to make collapse timing readable without staring at the ring.
