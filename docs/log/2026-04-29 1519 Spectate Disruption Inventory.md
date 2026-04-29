# 2026-04-29 1519 Spectate Disruption Inventory and Vertical Laser Lanes

## TL;DR
- What changed: After Phases A–E shipped, added spectate-side disruption tools so the dead/extracted player has agency instead of just watching. Spectator now regenerates 1 sabotage laser charge every 15s (cap 3) and can fire any of 6 lanes (3 horizontal on the right edge, 3 vertical on the top edge). Tapping anywhere else on the peer mirror sends a cosmetic ping marker (rate-limited 1/s). Sabotage laser warning bumped 900 → 1500ms after first feel pass.
- Why: User-reported feel after first playtest was that spectating an empty mirror was boring. Spec'd 1+2 of the suggestions list with regen-not-banking variant.
- What didn't work: N/A — TypeScript build green after each change. Live two-window playtest of the disruption tools still pending.
- Next: Two-window playtest of: vertical/horizontal lane choice, ping visibility, charge regen feel. Then balance pass on regen rate, max charges, lethal width.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`. This session ran Phase D feel-tune + Phase E ship + post-plan spectate-disruption design and ship.

### Sabotage laser warning bump

`src/game/data/tuning.ts`:

- `VERSUS_LASER_WARNING_MS` 900 → 1500. User feel pass said the original warning was too short to read and dodge. Same lethal window (500ms).

### Phase E — versus through MissionSelect

`src/game/systems/NetSystem.ts` added `MATCH_BRIEFING_READY` and `MATCH_DEPLOY` events plus payload types.

`src/game/scenes/VersusLobbyScene.ts`: lobby's `fireMatchStart` now `scene.start`s `MISSION_SELECT` (not `GAME`) with `mode: RunMode.VERSUS` and the existing multiplayer handoff. Lobby's job is now strictly pairing.

`src/game/scenes/MissionSelectScene.ts`:

- Accepts `multiplayer: MultiplayerHandoff` in `HandoffData`.
- New scene state: `multiplayer`, `versusLocalLocked`, `versusPeerLocked`, `versusDeployFired`, `versusHandingOff`.
- `setupVersusBriefingListeners` registers `MATCH_BRIEFING_READY` (mirror peer's lock state) and `MATCH_DEPLOY` (guest path: follow host into GameScene).
- `drawDeployButton` branches on versus: label switches to `LOCK IN` / `UNLOCK`, alpha pulse freezes when locked, peer status pill below button (`<PEER> // BRIEFING…` or `<PEER> // LOCKED`).
- `toggleVersusLockIn` flips local state, broadcasts `MATCH_BRIEFING_READY`, redraws.
- `maybeFireVersusDeploy` host-only: when both locked, host generates a fresh `matchId`, broadcasts `MATCH_DEPLOY`, and fires its own deploy.
- `fireVersusDeploy` saves missions, builds run boosts from saved company rep, calls `session.clearListeners()`, and `scene.start`s GameScene with own loadout + multiplayer handoff. Asymmetric loadouts are intentional (each side picks own).
- Cleanup: if leaving without firing deploy, `session.leave()` so peer sees the drop.

### Spectate disruption tools

User design decision: instead of banking laser pickups during own run, spectator gets +1 charge every 15s (cap 3). Plus tap-anywhere ping markers.

`src/game/data/tuning.ts` added `SPECTATE_LASER_REGEN_MS = 15000`, `SPECTATE_LASER_MAX_CHARGES = 3`, `SPECTATE_PING_COOLDOWN_MS = 1000`.

`src/game/systems/NetSystem.ts` added `MATCH_PING` event + `MatchPingPayload { x, y, t }` (arena-relative fractions).

`src/game/entities/VersusPingMarker.ts` (new): cosmetic 1.4s pulsing red ring at peer-supplied coord. No collision, no lethal effect.

`src/game/scenes/GameScene.ts`:

- New state: `spectateLaserCharges`, `spectateLaserAccumMs`, `spectatePingLastSendMs`, `spectateInventoryUi`, `spectateLaserChargesText`, `versusPingMarkers`, `versusPingRecvDedup`.
- Receiver: `MATCH_PING` listener, `spawnIncomingPing(fx, fy)` instantiates `VersusPingMarker` at peer-supplied arena coord.
- Sender: `fireSpectateLaser(lane)` consumes 1 charge and broadcasts `MATCH_LASER`. `fireSpectatePing(fx, fy)` rate-limits to 1/s and broadcasts `MATCH_PING`.
- `beginVersusSpectate` resets inventory state and calls `buildSpectateInventoryUi`.
- `endVersusSpectate` tears down UI.
- `tickSpectateInventory` advances regen accumulator and updates label text each frame.
- `tickPingMarkers` updates and reaps marker entities.
- `clearBoard` cleanup tears down spectate UI and ping markers.

### Vertical lane lasers

User asked for second axis on top edge so the spectator can shoot vertical beams too.

`src/game/entities/VersusLaserStrike.ts`:

- `VersusLaserLane` widened to `'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right'`.
- Constructor branches on `isHorizontal` (derived from lane). Horizontal lanes pick a Y band at 25% / 50% / 75% arena height; vertical lanes pick an X band at the same fractions of arena width.
- `hits(x, y, r)` checks the appropriate axis based on `isHorizontal`.

`src/game/systems/NetSystem.ts`: `MatchLaserPayload.lane` union expanded to 6 values.

`src/game/scenes/GameScene.ts`:

- Receiver lane validator now accepts the full 6-lane set.
- `buildSpectateInventoryUi` factors out a `drawLaneButton` helper and lays out two strips:
  - Right edge column: `TOP / MID / BOT` (horizontal sweeps).
  - Top edge row: `LEFT / CTR / RIGHT` (vertical sweeps).
- Charge counter moved to arena bottom-left so neither button strip occludes it.

### Build verification

`npm.cmd run build` passes after each step (Phase E, warning bump, spectate inventory, vertical lanes).

### Risks / follow-up

- Two-window playtest of all post-Phase-D additions still pending.
- Lane buttons sit over arena edges. Peer ship along those edges may be visually crowded by buttons. If it reads bad, shift buttons outside the arena rect.
- Regen 15s + cap 3 is a guess. May feel grindy or grief-y depending on match length.
- Pings use `COLORS.HAZARD` red — same color family as gunship lasers / beams. Could cause false-warning fatigue; consider a dedicated ping color.
- Pings don't echo back to the spectator's own screen as send confirmation. Could add a short local echo if "did my tap go through?" feels unclear.
- Palette change inside versus MissionSelect still tears down the multiplayer session (carried over from Phase E known issue).
- Peer-disconnect during briefing still leaves locked player waiting; no auto-unlock.
- Sabotage laser strikes still only target the local player; don't clear receiver-side NPCs/asteroids/enemies.
