# 2026-04-29 1101 Versus Rematch Button

## TL;DR
- What changed: Added in-place REMATCH on the versus result screen. Both peers tap REMATCH → both transition straight back into a fresh `GameScene` over the same `NetSession` (no lobby bounce, no re-handshake).
- Why: User asked for it after Phase 4 landed. Plan revision had deferred rematch as out-of-MVP, but the existing peer-wait UI pattern + persistent session made approach #1 (in-place) cheap.
- What didn't work: Considered bouncing back through `VersusLobbyScene`. Rejected — lobby's create() recreates the session from scratch; reusing it would need a "rejoin existing session" branch that duplicates the in-result waiting UI we already have for the 15s lone-extractor timeout.
- Next: Live two-window playtest. Phase 4 + rematch path are both build-green-only.

---

## Full notes

### Approach decision

In-place rematch over lobby bounce. Trade: more state on the result screen (4 new fields), but a single session lifetime spanning N matches and zero new scenes. Lobby code stays untouched.

### Wire format

Two new events on `NetSystem`:

```ts
NET_EVENT.MATCH_REMATCH_READY    // {} empty
NET_EVENT.MATCH_REMATCH_CANCEL   // {} empty
```

No payload — peer just signals intent. Match-restart fires locally on each peer once both flags are true; no `MATCH_START` rebroadcast needed because `matchId` doesn't need cross-peer agreement (it's only used for local logging; snapshot wire format uses sender clock).

### Match-restart trigger

```
both flags true → fireRematch():
  rematchInFlight = true
  build new MultiplayerHandoff over the SAME session
  session.clearListeners()       ← drops listeners, keeps channel + bindings alive
  scene.start(GAME, { multiplayer })
```

Each peer evaluates `maybeFireRematch()` on its own state change (local tap or peer event). Whichever side's transition completes first doesn't matter — both reach `setupMultiplayer` independently and re-bind listeners on the same session.

### Session persistence

Two pieces:

1. `teardownMultiplayer()` skips `session.leave()` when `rematchInFlight === true`. The successor scene's `setupMultiplayer` will own the session.
2. `NetSession.clearListeners()` (new method) — empties each per-event listener array in place but doesn't delete the map keys. Existing `channel.on('broadcast', ...)` callbacks become no-ops; new `onBroadcast` calls find a (now-empty but defined) array, append to it, and *don't* re-bind the channel (the early-exit check is `!existing`, and the array is still defined). This avoids double-binding which would fire each event twice in the new scene.

### Result-screen UI

The MENU button is now half-width and shares a row with a stateful primary button. Five visual states for the primary button:

| Local | Peer  | peerLeft | rematchInFlight | Label                  | Color    | Enabled |
| ----- | ----- | -------- | --------------- | ---------------------- | -------- | ------- |
| false | false | false    | false           | `REMATCH`              | HUD      | yes     |
| false | true  | false    | false           | `REMATCH (P2 READY)`   | GATE     | yes     |
| true  | false | false    | false           | `WAITING — CANCEL`     | HUD      | yes     |
| any   | any   | true     | false           | `P2 LEFT`              | HAZARD   | no      |
| any   | any   | any      | true            | `STARTING…`            | GATE     | no      |

Implementation: `createRematchPrimaryButton(x, y, w, h)` builds bg+label+hit zone with mutable refs. `apply()` closure rebuilds label/color/action/enabled based on the four flags and is stored in `this.rematchPrimaryRefresh`. Every state change (local tap, peer event, presence drop) calls `refreshRematchUi()` which invokes the closure.

### Peer-leave detection

New presence listener in `setupMultiplayer`:

```ts
session.onPresence((peers) => {
  if (rematchInFlight) return;
  const peerStillHere = peers.some(...);
  if (!peerStillHere && versusResultRendered) {
    peerLeft = true;
    peerRematch = false;
    refreshRematchUi();
  }
});
```

Gated on `versusResultRendered` so mid-match presence flicker doesn't permanently disable rematch. If peer is gone when local lands on the result screen, presence sync emits within a few ms and the button shows `P2 LEFT` immediately.

### Timing edge cases

- **Peer rematch arrives while local is still in 15s waiting panel:** `peerRematch` is stored, `refreshRematchUi` is a no-op (no rematch button rendered yet). When `renderVersusResult` finally fires (peer terminal arrived or timeout fired), the button is built and `apply()` reads the already-true `peerRematch` → button starts in `(P2 READY)` state.
- **Local taps REMATCH during waiting panel:** can't — waiting panel only has MENU. Rematch button only exists on the side-by-side result screen, which is past the gate.
- **Both tap REMATCH ~simultaneously:** broadcasts cross. Each side flips its local flag and broadcasts. Each receives the other's broadcast and flips peer flag. Both call `maybeFireRematch` from two paths (own tap + peer event); `rematchInFlight` flag debounces — first call wins, second call early-returns.
- **Peer disconnect mid-rematch:** `rematchInFlight=true` short-circuits the presence handler. The new scene will retry the heartbeat / forfeit logic at its own start.

### Files touched

Modified:
- `src/game/systems/NetSystem.ts` —
  - Added `NET_EVENT.MATCH_REMATCH_READY`, `NET_EVENT.MATCH_REMATCH_CANCEL`.
  - Added `NetSession.clearListeners()`.
- `src/game/scenes/GameScene.ts` —
  - New fields: `localRematch`, `peerRematch`, `rematchInFlight`, `peerLeft`, `rematchPrimaryRefresh`.
  - All five reset in `create()`.
  - `setupMultiplayer` adds two new broadcast listeners + presence listener.
  - New methods: `requestRematch`, `cancelRematch`, `maybeFireRematch`, `fireRematch`, `refreshRematchUi`, `createRematchPrimaryButton`.
  - `teardownMultiplayer` skips `session.leave()` on `rematchInFlight`.
  - `showVersusResultUi` now lays out a two-button row (rematch primary + half-width MENU).
  - `clearResultUi` nulls `rematchPrimaryRefresh`.

### Verify

1. `npm.cmd run build` — passes (clean tsc + vite, 870ms).
2. Live two-window playtest still owed (Phase 4 + rematch). Spot-check matrix:
   - Both tap REMATCH → straight into new countdown, mirror PIP works, fresh score.
   - One taps then other taps → second tap triggers transition.
   - One taps, peer hits MENU → tapper sees `P2 LEFT`, can fall back to MENU.
   - One taps, peer never taps → indefinite waiting, can cancel and re-tap.
   - Peer disconnects (close tab) mid-result → `P2 LEFT`.
   - Multiple rematches in a row (3+) over same session — confirm no listener-leak / score-bleed.

### Risks / follow-ups

- `clearListeners()` relies on the `!existing` early-exit in `onBroadcast` to avoid double-binding. If that code path is ever rewritten (e.g., to allow late binding for events that were never registered before), the rematch path must be re-checked.
- Peer-leave detection uses presence sync, which Supabase emits only on full disconnect. Idle-tab-with-channel-still-subscribed peers would not trigger `P2 LEFT`. Heartbeat-stall via missed snapshot timing is the actual liveness check (Phase 1 plan: >10s stall = forfeit) but isn't wired into the result screen yet — peer who silently goes offline post-result would just keep `peerRematch=false` indefinitely.
- Score / phase / wave RNG are independent per match (no seeded RNG). Rematch starts from match 1 difficulty, not "next phase." That matches versus's existing per-match independence — flag if it feels odd in playtest.
- Affiliation / mission set carries over across rematches via the session's player metadata. No way to re-pick between matches; would need a versus-flavored mission select.
