# 2026-04-29 2224 Versus Mirror Environment Detail

## TL;DR
- What changed: Expanded the live versus mirror snapshot/render path so the opponent backdrop can now show ghost asteroids, salvage, and laser lanes behind local gameplay, not just the peer ship/enemy/status layer.
- Why: User explicitly wanted to see the opponent's asteroids, salvage, and lasers behind their own arena during multiplayer.
- What didn't work: First build failed on a typed literal mismatch in the new laser snapshot payload. Fixed and reran. No manual two-window playtest yet.
- Next: Run a real versus match on desktop and phone-sized viewports to judge readability and framerate, then decide whether boss-beam mirroring or a constrained-mobile toggle is needed.

---

## Full notes

This session intentionally diverged from the prior tutorial/menu wrap state because the user explicitly redirected work back to multiplayer mirror fidelity.

### Plan

Wrote `docs/plans/2026-04-29 2224 Plan - Versus Mirror Environment Detail.md` to capture the scoped approach:

- extend `MirrorSnapshot`
- reuse the existing full-arena mirror backdrop
- keep the mirror cheap and low-fidelity instead of attempting remote screen streaming

### Snapshot expansion

`src/game/systems/NetSystem.ts`:

- added `MirrorDrifterSnapshot`
- added `MirrorSalvageSnapshot`
- added `MirrorLaserSnapshot`
- extended `MirrorSnapshot` to include `drifters`, `salvage`, and `lasers`

`src/game/scenes/GameScene.ts` `sendSnapshot()`:

- now serializes active peer asteroids as normalized position + radius + mineable flag
- now serializes active salvage as normalized position + salvage radius + rare flag
- now serializes active standard beam hazards plus live versus sabotage lanes as normalized laser records

The payload stays intentionally simplified. We are still mirroring arena state, not cloning full remote entities or UI.

### Live mirror rendering

`src/game/scenes/GameScene.ts` `updateMirrorBackdrop()`:

- now draws ghost drifters before the existing ship/enemy layer
- now draws ghost salvage rings/bodies
- now draws opponent laser lanes over the mirror backdrop

Added helper render methods so the new detail stays scoped and readable:

- `drawMirrorDrifters(...)`
- `drawMirrorSalvage(...)`
- `drawMirrorLasers(...)`

Important design choice: these new mirror elements render independently of the old `mirrorLiveRenderEnemies` mobile cut. That means constrained phone-sized live versus can still hide the heavier enemy field while restoring the specific asteroid/salvage/laser context the user asked for.

### Verification

`npm.cmd run build` passes after the change.

### Remaining risk

- No human two-window pass yet, so readability/framerate is still an open question.
- Boss/gunship-specific beam state is still outside this mirror pass.
- The new backdrop uses simplified circles/rects/lines, not the opponent's exact polygon/rect geometry.
