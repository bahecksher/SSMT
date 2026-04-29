# 2026-04-29 0923 Versus Multiplayer Phase 3 Mirror Viewport

## TL;DR
- What changed: Phase 3 of mirrored versus. Replaced the debug `P2 ALIVE SCORE n PH n E n` text HUD in `GameScene` with a small ghost-rendered mirror PIP in the bottom-right of the arena. Sender now normalizes ship + enemy coords to arena-relative fractions before broadcasting; receiver maps fractions into mirror-rect pixels. Added two-snapshot position/angle interpolation using each snapshot's `t` field plus local arrival time for the buffered render clock.
- Why: Phase 1+2 landed snapshot transport, but rendering was still a debug text line and coords were screen-space pixels — peers on different viewport sizes would render the ghost in the wrong relative position.
- What didn't work: Considered the plan's portrait-stacked layout (own arena top, mirror bottom). Rejected for MVP: on a 540×960 phone, splitting in half drops the live arena from ~470×870 to ~470×435 — large layout/gameplay-bounds refactor for marginal gain. PIP corner is the MVP; stacked layout is now a Phase 6 polish item.
- Next: Phase 4. Extract / death events broadcast on terminal state, side-by-side result screen, match termination logic.

---

## Full notes

### Design decisions settled before code

**1. Coordinate normalization — sender side, arena-relative fractions.**

Sender computes `(worldX − arenaLeft) / arenaWidth` and `(worldY − arenaTop) / arenaHeight`, rounded to 4 decimals. Receiver maps fractions into its own mirror rect:

```ts
const mapX = (fx) => rect.x + clamp01(fx) * rect.w;
```

Picked over "send raw + sender viewport" because:
- Receiver doesn't need the sender's viewport in every snapshot frame.
- Resize events on either side don't desync the wire format.
- Future stacked layout reuses the same fraction with a different rect — no sender change needed.

Tradeoff: enemies that spawn outside arena bounds (margin offscreen) will read fractions slightly outside `[0..1]` and get clamped to the mirror edge. Acceptable for ghost render.

**2. Layout — PIP corner, not stacked split.**

`MIRROR_FRAC = 0.28` of arena, bottom-right corner with 8px inset. Floor at 80×80px so it stays legible on small viewports. Stacked split deferred — would need every entity bound, the arena-density scale, and `getLayout()` consumers to operate against a half-height viewport, which is out of Phase 3 scope.

### Wire format

`MirrorSnapshot` interface gained doc comments clarifying that ship + enemy x/y are arena fractions, angle is sender heading in radians. No structural change — old shape was already `{ x: number, y: number }` so existing in-flight code stays compatible during deploy. (Mixed-version peers would just render mis-scaled ghosts for one match — acceptable since both peers refresh their build before joining a room anyway.)

### Receiver pipeline

Old:
```ts
private peerSnapshots: MirrorSnapshot[] = [];
```

New:
```ts
private peerSnapshots: { snap: MirrorSnapshot; arr: number }[] = [];
```

Local arrival time `arr` is `Date.now()` at receive. Used as the anchor for the buffered render clock so we don't have to share clocks across peers.

### Interpolation

Render two snapshots behind a 100ms buffer so `older` and `newer` straddle the render moment:

```ts
const dt = max(1, newer.snap.t - older.snap.t);          // ~100ms
const localElapsed = Date.now() - newer.arr;
const renderT = newer.snap.t + localElapsed - 100;        // 100ms behind newest
const alpha = clamp01((renderT - older.snap.t) / dt);
```

When a fresh snapshot just landed, `localElapsed = 0`, `renderT = older.snap.t`, `alpha = 0` — render the older sample. As the local frame clock advances, `alpha` climbs to 1 and we settle on the newer sample right around the moment the next snapshot arrives. Smooth even with mild jitter; doesn't extrapolate past the newest sample.

Ship angle uses `Phaser.Math.Angle.Wrap` for shortest-path interpolation. Enemy match-up is by index — snapshots don't carry stable enemy IDs (the schema reserves a `type` byte but not an id). Index pair-up is fragile if the enemy list reorders mid-snapshot, but at low alpha + 100ms rate it's invisible. Stable enemy IDs are a Phase 6 polish item if anyone notices ghost-shimmer.

### Mirror PIP rendering

New helpers on `GameScene`:

- `createMirrorViewport()` — builds bg `Graphics` (depth 118), entities `Graphics` (depth 119), label `Text` "P2 — score — phase" (depth 120), and a centered "WAITING" placeholder (depth 120) shown until first snapshot arrives.
- `drawMirrorBg()` — translucent BG fill + 1px HUD-color border. One-time draw.
- `updateMirrorViewport()` — clears + redraws entities every frame. Called from `tickMultiplayer()` on every frame (not gated to snapshot tick) so interpolation updates smoothly.
- `teardownMultiplayer()` — destroys all four mirror objects + clears `mirrorRect`.

Ship rendered as a small triangle (radius 5px) in `COLORS.PLAYER` at 0.75 stroke / 0.25 fill. Shielded ships get a 1.6×radius ring overlay. Dead ships render as a red `X` in `COLORS.HAZARD`. Enemies render as 2.2px filled circles in `COLORS.ENEMY` at 0.45 alpha. No bullets, no shadows, no audio — out of scope per plan.

Label text format: `P2  <KIA?>  <score>  PH <phase>`.

### Constants added

```ts
private static readonly MIRROR_INTERP_BUFFER_MS = 100;
private static readonly MIRROR_FRAC = 0.28;
private static readonly MIRROR_INSET_PX = 8;
```

`SNAPSHOT_INTERVAL_MS = 100` unchanged.

### Files touched

Modified:
- `src/game/systems/NetSystem.ts` — JSDoc on `MirrorSnapshot` clarifying fraction convention. No structural change.
- `src/game/scenes/GameScene.ts`:
  - Module-level `lerpAngleShortest` helper (was added in this session before the resume).
  - Replaced `peerHudText` field with mirror PIP fields (`mirrorRect`, `mirrorBg`, `mirrorEntities`, `mirrorLabel`, `mirrorWaiting`).
  - Changed `peerSnapshots` element type to `{ snap, arr }`.
  - SNAPSHOT listener now stores arrival time alongside snapshot.
  - `setupMultiplayer` → calls new `createMirrorViewport`.
  - `sendSnapshot` → normalizes ship + enemy coords to arena fractions.
  - Replaced `updatePeerHud` with `updateMirrorViewport` (reads two-snapshot lerp + redraws ghost graphics).
  - `teardownMultiplayer` destroys all new mirror objects.

### Verify

1. `npm.cmd run build` — passes (clean tsc + vite, 694ms).
2. `npm.cmd run dev` — running on http://localhost:5175/ (5173/5174 were already in use).
3. Open two browser windows on http://localhost:5175/, route VERSUS → Create Room (window A) → Join Room (window B with code) → both READY → countdown → both land in `GameScene`. Each should see the other's ghost ship + enemy dots in the bottom-right PIP, moving smoothly.

### Risks / follow-ups

- Enemy index pair-up is fragile across spawn/despawn churn. Stable IDs is a Phase 6 polish item if ghost-shimmer is noticeable.
- PIP currently overlaps no existing UI in normal gameplay — the bottom-right corner is unused — but `ExtractGate` and the result screen draw over the same region. Mirror rect stays visible during result screen unless `teardownMultiplayer` is called; current teardown only fires on `cleanup()`. If result screen layering looks bad in playtest, hide the mirror in `state === RESULTS`.
- Stacked-layout variant still on the table for Phase 6, but would need a real arena-bounds split.
- Mixed-version peers (one normalized sender, one absolute sender) would render mis-scaled ghosts. Both clients refresh before joining a room, so MVP-tolerable; flag for the eventual schema-version handshake.

### Phase 4 starting points

- Wire `extract`/`death` broadcast events in `GameScene` terminal-state transitions.
- Result scene side-by-side comparison reusing existing post-run summary styling.
- Match-end logic: both peers terminal OR (one extract + one death).
