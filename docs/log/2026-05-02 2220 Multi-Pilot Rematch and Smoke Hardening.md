# 2026-05-02 2220 Multi-Pilot Rematch and Smoke Hardening

## TL;DR
- What changed: Added multi-pilot REMATCH button + per-peer ready logic for 3p/4p Versus. Fixed four bugs surfaced during the ship-hardening smoke matrix walk: MenuScene scene-reuse crash on MENU return, friendly-fire echo on shooter's own terminal, pilot color drift onto disconnected pilot's row, and lobby roster crowding under the room code with 3-4 pilots.
- Why: User redirected mid-smoke to land multi-pilot rematch and clear blockers before continuing the matrix.
- What didn't work: Could not pin the 4p broadcast laser miss to one peer (C). Receiver code path is clean; no client-side fix without runtime repro confirming root cause. Documented as deferred; suspect Supabase realtime drop under multi-window load on a single test machine.
- Next: Smoke-test the new multi-pilot rematch in 3p/4p with ready/cancel/disconnect interleaving. Re-attempt 4p broadcast laser repro with peers foregrounded or on separate machines. Resume ship-hardening matrix at death-attribution coverage, mobile pass, and solo regression sweep.

---

## Full notes

### Smoke matrix progress (before redirect)
1v1 row 1-7: all green (create/join/ready/deploy, both extract, both die, mixed, spectate, repulsor, rematch).
2p row: auto-confirmed (1v1 path).
3p row: lobby + ready + deploy + ghost ships + broadcast laser + broadcast enemy + terminal scoreboard + final standings + mid-disconnect — all pass with two cosmetic carve-outs (lobby crowding, color drift on disconnect — both fixed in this session).
4p row: lobby + ready + deploy + ghost ships pass. Broadcast laser/enemy partial pass — D fired and A + B received in D's color, C did not. Friendly-fire echo on D's terminal also flagged.

### MenuScene scene-reuse crash
Repro: any MENU press from a multi-pilot result froze all peer windows. Console (gathered after asking user to capture in DevTools):
```
Uncaught TypeError: Cannot read properties of null (reading 'drawImage')
  at MenuScene.updateModeTabStyles (MenuScene.ts:1117)
  at MenuScene.create (MenuScene.ts:437)
```
Cause: `MenuScene.create()` calls `this.updateModeTabStyles()` at line 437, which at line 1117 calls `this.primaryActionText?.setText(...)`. `primaryActionText` is created at line 472 — AFTER 437. On the first scene boot the field is `undefined` and the optional chain skips. Phaser reuses scene instances across `scene.start()` calls, so on every subsequent boot the field still holds the prior instance's destroyed Text reference; optional chaining does not skip it, and `setText` walks a nulled texture frame and throws. The RAF loop kept running, which is why all three windows looked frozen rather than crashing visibly.
Fix: moved `this.updateModeTabStyles()` and `this.updateLeaderboardViewStyles()` from line 437-438 to immediately after `primaryActionText` creation. One-line move, no semantic change. Verified: 1v1 + 3p MENU returns no longer freeze.
Latent: there is a class of similar bugs lurking in any `!:`-declared field that is touched before re-assignment in `create()`. Did not sweep — post-ship cleanup. Documented in Known Issues.

### Multi-pilot rematch
User asked for parity with 1v1 rematch. Implementation:
- New `MatchRematchPayload { senderId? }` in NetSystem (rematch was previously `{}`).
- New GameScene field `peerRematchMap: Map<playerId, boolean>` and `versusColorByPlayerId: Map<playerId, number>` (used for color drift fix as well).
- `MATCH_REMATCH_READY` and `_CANCEL` receivers extract `senderId` and write into `peerRematchMap`.
- `requestRematch` / `cancelRematch` broadcast their own `senderId`.
- `requestRematch` no longer bails on `peerLeft` in multi-pilot — leavers don't block the room.
- New helper `getMultiPilotRematchStatus()` computes `{ready, total}` over currently-present peers.
- `maybeFireRematch()` branches: 1v1 keeps existing predicate; multi fires when `localRematch && total > 0 && ready === total`.
- `createRematchPrimaryButton.apply()` branches on `isMultiPilotVersus()`. Multi-pilot label cycles `REMATCH` → `REMATCH (X/N READY)` → `WAITING (X/N) — CANCEL` → `STARTING…`. Disabled when no peers remain (`ALL LEFT`).
- `showMultiPilotResultUi` now lays out REMATCH + MENU side by side (mirroring 1v1 layout) instead of single full-width MENU.
- Presence handler in `setupMultiplayer` removes a leaver's playerId from `peerRematchMap` and re-evaluates `maybeFireRematch` so a remaining "ready" peer no longer blocks the rematch when the holdout disconnects.
Risk: feature was added at the ship gate. Needs a multi-window smoke run to verify. No solo regression expected — rematch path only fires in versus.

### Friendly-fire echo on shooter's terminal
Cause: `fireSpectateLaser` (GameScene.ts:2420) calls `addSentLaserMirrorEcho` which paints the local laser onto the spectate mirror viewport. In 1v1 this is correct UX — the shooter sees their shot land in the peer's arena. In multi-pilot terminal there's no clean single peer mirror; the heavy-dimmed primary-peer mirror still renders, and the echo bleeds onto the standings as if the shooter took a hit.
Fix: skip the echo call when `isMultiPilotVersus()`. Broadcast still goes out to all peers; no behavioral change for receivers. Did not touch `fireVersusLaser` (alive-play path) since alive arena does not render the mirror viewport.

### Color drift on disconnect
Cause: `NetSession.getPlayerColor` looks up the playerId's current index in `getActivePlayers()`. When a pilot disconnects, their playerId drops from `getActivePlayers()`, `findIndex` returns `-1`, `Math.max(0, -1) = 0`, and the leaver's row in the standings is rendered in the first remaining pilot's color (color index 0).
Fix: snapshot the initial roster→color map in GameScene at `setupMultiplayer` (`versusColorByPlayerId`). New helper `getVersusColorForPlayer` reads the cache first and falls back to the live session lookup. Standings row color now goes through the helper instead of calling `session.getPlayerColor` directly. Stable across disconnects.

### Lobby roster crowding
Cause: `MenuScene.renderVersusLobby` rendered the multi-line stacked roster centered on `peerY` (default origin 0.5, 0.5). With 3-4 pilots the roster grows tall in both directions; the upper half pushed up into the room code line.
Fix: `peerText.setOrigin(0.5, 0)` so the roster is top-anchored at `peerY` and grows downward only. Adjusted hint/button shift constants accordingly (`extraH` instead of `extraH / 2`).

### 4p broadcast laser miss
Could not fix without runtime data. Receiver path at `GameScene.ts:2200-2214` is clean and dedup is per-receiver (no cross-receiver collision possible). Most likely Supabase realtime delivery dropped under multi-window load, or browser background-tab throttling on C. Did not add retry / instrumentation — would need confirmed repro first. Documented in Known Issues with the steps to retest (foreground C, separate machines).

### Build + git status
`npm.cmd run build` clean before commit (582.90 kB index bundle, 1198.74 kB phaser bundle).

### Files touched
- `src/game/scenes/MenuScene.ts` — scene-reuse crash fix; lobby roster top-anchor.
- `src/game/scenes/GameScene.ts` — multi-pilot rematch state + UI; friendly-fire echo skip; color drift cache + lookup helper; presence cleanup of rematch map.
- `src/game/systems/NetSystem.ts` — added `MatchRematchPayload` type.
- `docs/state.md` — rewrite per CLAUDE.md.
- `docs/log/2026-05-02 2220 Multi-Pilot Rematch and Smoke Hardening.md` — this file.
