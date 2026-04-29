# Plan - Mirrored Versus Multiplayer

_Created: 2026-04-28 2304_

## Goal

Two-player versus mode where each player runs a full local sim of their own arena and sees a low-fidelity mirror of the opponent's arena until extract or death. No shared physics, no authoritative server. Match resolves on extract/death by comparing scores.

## Approach

### Phase 0 - Decisions to lock before code

- Transport: Supabase Realtime broadcast channels (already in stack, no new infra).
- Authority model: each player is sole authority over own run. Opponent view is read-only ghost render from snapshots. No hit reconciliation.
- Match scope: 1v1 only for MVP. Lobby = code-based room join (4-6 char alphanumeric). No matchmaking.
- Shared waves: out of scope for MVP. Each player gets independent RNG. Add seeded RNG only if/when "fair race" mode is requested.
- Layout: portrait-stacked viewports. Own arena top, opponent mirror bottom, opponent half scaled and dimmed. Landscape later.

### Phase 1 - Net plumbing

- Add `src/game/systems/NetSystem.ts`:
  - `connect(roomCode, role)` opens Supabase Realtime channel.
  - `presence` tracks both clients ready state for match start.
  - `broadcast(type, payload)` for snapshot, extract, death events.
  - `onSnapshot(cb)`, `onMatchEvent(cb)` consumer hooks.
- Match start handshake: both clients send `ready`, channel emits `start` with shared `matchId` + `startTimestamp`. Both transition to GameScene with `multiplayer: { role, peerId, matchId }` payload.
- Heartbeat: if no snapshot from peer for >3s, mark peer as stalled in mirror UI. If >10s, treat as forfeit.

### Phase 2 - Snapshot serializer

- Define `MirrorSnapshot` schema:
  ```ts
  {
    t: number,           // sender clock ms since match start
    ship: { x, y, angle, hp, alive: boolean },
    enemies: Array<{ id, type, x, y }>,   // type as small enum int
    score: number,
    phase: number,
    extracted: boolean,
  }
  ```
- Sender: 10Hz tick in `GameScene.update` driven by elapsed time accumulator. Pull state from `Player`, `EnemySystem`, `ScoreSystem`, `MusicSystem`. Drop bullets entirely for MVP.
- Encode as plain JSON for first cut. Optimize to typed-array packing only if bandwidth becomes a problem.
- Receiver: keep last 2 snapshots for interpolation. Drop snapshots older than newest received (out-of-order arrives are normal).

### Phase 3 - Mirror renderer

- New `src/game/scenes/MirrorScene.ts` or sub-camera in GameScene.
- Reads latest peer snapshot every frame, interpolates ship + enemy positions between last two snapshots using `t` field.
- Renders:
  - Own ship sprite as ghost (low alpha, peer's palette tint).
  - Enemy sprites by type, no animation, no hitbox, no shadow.
  - Score readout overlay.
  - Phase badge.
- Viewport: portrait split = own arena top half, mirror bottom half. Mirror world bounds match own arena dimensions, scale-to-fit. Dim with color matrix or alpha overlay.
- No audio from mirror. Own MusicSystem unchanged.

### Phase 4 - Match resolution

- `extract` event broadcast on successful extract: `{ score, time, rep }`.
- `death` event broadcast on death without extract: `{ score, time }`.
- Match ends when both players have sent a terminal event OR one extract + one death.
- Result scene: side-by-side score comparison, winner banner. Reuse existing post-run summary styling.
- Leaderboard: each player's run still writes own score to existing arcade leaderboard. Versus result is local-only for MVP - no separate versus ladder.

### Phase 5 - Lobby UI

- New menu entry "Versus" alongside Arcade/Campaign.
- Two buttons: "Create Room" -> generates code, copies to clipboard, waits. "Join Room" -> text input.
- Show peer presence, "Ready" button on both sides. Once both ready, countdown 3-2-1, then start.
- Cancel button always available before start.

### Phase 6 - Polish + mobile

- Portrait stacked viewport tuned so own arena is not too cramped. Test on phone.
- Add toggle: "Big self / Small mirror" PIP variant if split halves feel bad on mobile.
- Stalled-peer indicator (greyed mirror + "peer stalled" text).
- Forfeit handling on disconnect.

## Scope boundaries

Out of scope:

- PvP attacks between arenas (no garbage-send, no curse mechanic).
- Shared enemy waves / shared seed RNG.
- Shared music phase clock.
- Bullet mirroring.
- 3+ player matches.
- Authoritative server / cheat resistance.
- Versus leaderboard / ranking.
- Reconnect after disconnect.
- Spectator mode.
- Anti-cheat. Score in versus mode is trust-based.

## Open questions

- Is portrait stacked split acceptable on small phones, or should mirror default to PIP corner?
- Should versus runs count toward existing arcade leaderboard, or be flagged separately so versus self-reports do not pollute the ladder?
- Supabase Realtime free-tier message budget at 10Hz x 2 players: ~1.7M msg/month for one always-on pair. Need to confirm we will not blow the 2M/month free cap with even modest usage.
- Match length cap (forced extract or auto-end after N minutes) needed?
- Versus mode unlocked from menu directly, or gated behind first arcade run completion?

## Effort estimate

MVP (no shared waves, no PvP, no bullet mirror): 3-5 days.

- Day 1: Phase 1 net plumbing + lobby skeleton.
- Day 2: Phase 2 snapshot send + receive.
- Day 3: Phase 3 mirror render.
- Day 4: Phase 4 match resolution + result screen.
- Day 5: Phase 5/6 lobby polish + mobile layout.
