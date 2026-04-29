# 2026-04-28 2345 Versus Multiplayer Phases 1 and 2

## TL;DR
- What changed: Implemented Phase 1 (lobby + ready handshake) and Phase 2 (10Hz snapshot pipeline) of the mirrored versus plan. Two browser windows can now create/join a room, ready up, transition into GameScene together, and exchange `MirrorSnapshot` payloads at 10Hz with a debug peer HUD top-right.
- Why: User chose mirrored 1v1 multiplayer (each player runs own full sim, opponent rendered as low-fi ghost from snapshots) over shared-arena co-op. This session converted the active plan into shippable network plumbing.
- What didn't work: Three real bugs surfaced and got fixed:
  1. Initial `isHost()` election compared `joinedAt` from presence payload; if the number didn't round-trip cleanly, both sides could elect the other → no broadcast → no countdown. Switched to playerId-only string compare.
  2. `getPeers()` initially read `entries[0]`, but Phoenix Presence (Supabase Realtime's underlying transport) appends a new meta on each `track()` call. Always-stale `ready: false` was returned. Fixed by reading `entries[entries.length - 1]`.
  3. Score field in MirrorSnapshot was a raw float; debug HUD printed `426.################`. Wrapped score and ship/enemy positions in `Math.round`.
- Next: Phase 3 — replace the debug `P2 ...` HUD with an actual scaled mirror viewport rendering peer ship + enemies as ghost sprites, interpolated between last two snapshots using the `t` field.

---

## Full notes

### Phase 1: lobby + handshake

New files:

- `src/game/systems/NetSystem.ts` — `NetSession` class wrapping Supabase Realtime channel. API:
  - Constructor takes `roomCode`, `playerId`. `joinedAt` captured at construction.
  - `onPresence(cb)`, `onBroadcast(event, cb)`, `onStatus(cb)` — register listeners. Pre-`join()` listeners are wired inside `join()`. Post-`join()` listeners are bound on the live channel via `bindBroadcastEvent` (added in Phase 2 to support late SNAPSHOT registration from GameScene).
  - `join()` opens the channel, registers presence + broadcast bindings, awaits `SUBSCRIBED` status, fires `track({playerId, ready:false, joinedAt})`.
  - `setReady(ready)` re-tracks presence with new `ready` value.
  - `broadcast(event, payload)` sends a broadcast frame.
  - `getPeers()` reads `presenceState()` and pulls the **latest** meta entry per key (Phoenix Presence appends).
  - `isHost()` returns true iff our `playerId` is the lexicographic minimum across all presence entries — purely deterministic, no `joinedAt` dependency.
  - `leave()` untracks + removes channel.
- `src/game/scenes/VersusLobbyScene.ts` — state machine `IDLE | JOINING | WAITING | COUNTDOWN | STARTED | ERROR`. CREATE ROOM generates a 4-char alphanumeric code; JOIN ROOM uses `window.prompt()` for input (functional but ugly — flagged for replacement). Presence-driven READY toggle. Once both peers are ready, host-only `maybeStartCountdown` broadcasts `match_start { matchId, delayMs:3000 }` and starts a local countdown; guest receives the broadcast and starts its own identical local countdown. On countdown end, host hands off the live `NetSession` to GameScene via `MultiplayerHandoff` (no `leave()` because GameScene takes ownership).

Wiring:

- `SCENE_KEYS.VERSUS_LOBBY` added to `constants.ts`.
- `MenuScene` got a `VERSUS` button below `HOW TO PLAY`, top-left corner.
- `config.ts` registers the new scene.

### Phase 2: snapshot pipeline

New types in `NetSystem.ts`:

```ts
export interface MultiplayerHandoff {
  session: NetSession;
  role: 'host' | 'guest';
  matchId: string;
  peerId: string;
  startAt: number;
}

export interface MirrorSnapshot {
  t: number;        // ms since match start (sender clock)
  ship: { x, y, angle, alive, shielded };
  enemies: Array<{ x, y, type }>;
  score: number;
  phase: number;
  extracted: boolean;
}
```

`Player` got a `getHeading()` accessor (the field was private).

`GameScene.ts` accepts `MultiplayerHandoff` via `MenuHandoff.multiplayer`. New private fields:

```ts
private static readonly SNAPSHOT_INTERVAL_MS = 100;
private multiplayer: MultiplayerHandoff | null = null;
private snapshotAccumMs = 0;
private peerSnapshots: MirrorSnapshot[] = [];
private matchClockStartMs = 0;
private peerHudText: Phaser.GameObjects.Text | null = null;
```

`setupMultiplayer(handoff)` registers a SNAPSHOT broadcast listener (which now binds late onto the running channel) and creates the top-right `peerHudText` ("P2 ALIVE  SCORE n  PH n  E n"). `tickMultiplayer(delta)` accumulates `delta` and fires `sendSnapshot()` every 100ms; runs from the bottom of `update()` so all per-frame state is current before serializing. `teardownMultiplayer()` is called from `cleanup()` and leaves the channel cleanly.

Snapshot values are rounded:
- ship.x / ship.y / enemies[].x,y → `Math.round` (integer pixels).
- ship.angle → 3 decimal places.
- score → `Math.round`.

### Bug log this session

1. **Host election broken on `joinedAt`** — diagnostic logs showed `isHost: false` on both clients. Replaced number-based election with playerId string compare.
2. **Presence stuck at `ready: false`** — both clients saw each other as `ready: false` after toggling READY. Root cause: `presenceState()` returned an array of metas per key; reading `entries[0]` always gave the original (`ready: false`) join state. Fixed by reading the last entry.
3. **Float score garbage** — `SCORE 426.################`. Wrapped in `Math.round`.

Diagnostic `console.log` lines were left in place during debugging and stripped once the path was confirmed working.

### Files touched

Created:
- `src/game/systems/NetSystem.ts`
- `src/game/scenes/VersusLobbyScene.ts`

Modified:
- `src/game/constants.ts` — added `SCENE_KEYS.VERSUS_LOBBY`.
- `src/game/types.ts` — added `MultiplayerSession`, `NetRole`. (Note: the actively-used handoff type is `MultiplayerHandoff` defined in `NetSystem.ts`, not `MultiplayerSession`. The latter is currently unused — flag for cleanup.)
- `src/game/config.ts` — registered `VersusLobbyScene`.
- `src/game/scenes/MenuScene.ts` — `versusButton` field, `createVersusButton()` method, invocation alongside `createHowToPlayButton`.
- `src/game/entities/Player.ts` — `getHeading()` accessor.
- `src/game/scenes/GameScene.ts` — `MenuHandoff.multiplayer`, multiplayer fields, `setupMultiplayer`, `tickMultiplayer`, `sendSnapshot`, `updatePeerHud`, `teardownMultiplayer`. `tickMultiplayer(delta)` called from bottom of `update()`. `teardownMultiplayer()` called from `cleanup()`.

### Risks / follow-ups

- `MultiplayerSession` type in `types.ts` is now unused (was authored before the handoff API settled). Remove on next pass.
- Late-bind `onBroadcast` relies on `channel.on('broadcast', { event }, cb)` working after `subscribe()`. Confirmed in playtest with SNAPSHOT events arriving on GameScene side.
- Player position (and other fields) is in screen coordinates; a peer playing at a different viewport size will produce ghost positions that don't map cleanly. Phase 3 needs to normalize to arena-relative coords (e.g. fractions of `arenaWidth` / `arenaHeight`) before mirror render, otherwise small phones vs desktops will look wrong.
- No match length cap. If both players survive forever, the channel just stays open. Phase 4 should add an explicit termination event.
- Supabase Realtime free-tier message budget at 10Hz × 2 players ≈ ~1.7M msg/month for one always-on pair. Comfortable headroom under the 2M cap, but flag for monitoring.
