# Plan - Versus Mission Select, Extract-Required Win, Sabotage Laser, Spectate, Rematch Ghost Fix
_Created: 2026-04-29 1432_

## Goal

Layer four feature changes and one bug fix onto the existing mirrored versus pipeline:

1. Route versus through `MissionSelectScene` so both players pick contracts and favors before deploy.
2. Change versus win condition: extracting is required to win; otherwise draw.
3. Add a versus-only sabotage power-up that fires a cross-arena laser sweep at the opponent.
4. After local run ends, spectate the peer's arena fullscreen until the peer also terminates.
5. Fix the rematch ghost-ship bug where the peer ship appears frozen at the previous round's extract location.

User decisions locked:
- Versus contracts/favors spend the real shared wallet.
- Each side picks own loadout (asymmetric is allowed).
- Sabotage laser is a cross-arena lane sweep, not a seek-ship beam.
- Spectate runs until the peer ends — no hard timeout.

## Approach

### Phase A — Rematch ghost-ship fix (smallest, ship first)

Receiver-side cleanup so a stale `extracted:true` snapshot from the previous round cannot render on the new round.

- Add a `matchEpoch` (number, ms) to `MultiplayerHandoff`. Bumped each rematch by host, mirrored to guest via the existing rematch broadcast.
- Stamp every outgoing `MirrorSnapshot` with `epoch` matching the current handoff.
- Receiver: drop snapshots whose `epoch !== currentEpoch`. Clear `peerSnapshots` on rematch transition (already done on `setupMultiplayer`, but defensively re-clear after the new epoch is known).
- Sender: emit one fresh snapshot the instant the new countdown begins so the mirror has a current frame, not a stale one.

Build verify, no plan ambiguity here — done.

### Phase B — Extract-required win condition

Modify the versus result resolver around `resolveVersusOutcome` / the local+peer outcome compare path in `GameScene.ts` (~2238+).

Outcome rules:

| Local | Peer | Result |
|---|---|---|
| extract | extract | higher score wins, tie at equal score |
| extract | death | local WINS |
| death | extract | local LOSES |
| death | death | DRAW |
| extract | timeout still alive | local WINS (peer never extracted within wait window) |
| extract | left/disconnect before extract | local WINS |

Note: existing 15s peer-wait timer still applies to the extract-vs-alive case so that surviving peer cannot just stall forever; if it fires and peer never extracts, local wins.

Result-screen UI: replace plain score-higher banner with `WIN`/`LOSE`/`DRAW` plus reason copy (`EXTRACTED FIRST`, `BOTH EXTRACTED`, `BOTH DOWN`, `OPPONENT EXTRACTED`).

### Phase C — Spectate-until-peer-ends

Replace the current 15s extract-wait panel with a fullscreen mirror takeover that lasts until the peer broadcasts an extract or death (or leaves).

- New `GameState.SPECTATING` value (or reuse `RESULTS` with a `spectating` sub-flag — pick the smaller-blast-radius option during implementation).
- On local extract OR local death, if peer is still alive (no terminal event received yet):
  - Hide local arena rendering (already paused by the existing post-run freeze).
  - Render peer mirror at full viewport using the existing snapshot interpolation path, but with full enemy detail and a `SPECTATING <CALLSIGN>` header.
  - Show local outcome chip in a corner (`EXTRACTED 12,400` or `DOWN 9,800`) so the player remembers their pending result.
- Heartbeat fallback already exists (`MATCH_RESULT_PULSE`); reuse it: if peer pulse silent for >3.5s, surface `<CALLSIGN> LEFT` and resolve via the existing peer-left path.
- When peer's terminal event arrives, transition to the unified result screen from Phase B.

No hard timeout per user decision — only the existing peer-left heartbeat watchdog ends spectate early.

### Phase D — Sabotage laser power-up (versus-only)

New pickup that drops from enemy and NPC deaths only in versus runs.

- Tuning (data-driven in `tuning.ts`):
  - `VERSUS_LASER_DROP_CHANCE` ~ 0.08 (8%) on enemy kill
  - `VERSUS_LASER_DROP_CHANCE_NPC` ~ 0.04 (4%) on NPC kill
  - 1.5s collection delay matching other pickups
  - 6s cooldown after firing before the player can carry another (held one at a time, like the old bomb button model)
- Pickup visual: small versus-only sigil pickup, distinct color (suggest violet/magenta to stand apart from cyan/red lanes).
- Pickup logic: collected → broadcast new `MATCH_LASER` event with `{ lane: 'top' | 'middle' | 'bottom', warningMs, lethalMs }`. Lane choice: send picks lane (UI: tap one of three on-screen markers, or auto-cycle). Start with auto-random lane, add manual aim later if requested.
- Receiver: spawns a cross-arena lane sweep using the existing beam hazard renderer with a versus-flagged red/magenta tint. Reuses safe → warning → lethal cycle from the gunship laser system to keep the readability contract identical.
- Score/credit interaction: pickup itself worth 0c (it's a weapon, not money). Kills the laser causes drop the standard NPC/enemy bounty as normal.
- New events on `NetSystem`:
  - `MATCH_LASER` — payload `{ lane, warningMs, lethalMs, t }`
  - Replay protection: receiver dedupes by `(senderId, t)` if Supabase double-delivers.

### Phase E — MissionSelect reuse for versus

Insert a versus-flavored MissionSelect step between lobby READY and GameScene.

- Add `RunMode.VERSUS` to the run-mode enum.
- Lobby flow change:
  - Both READY → host broadcasts existing `MATCH_START` but with `delayMs: 0` and a new `phase: 'briefing'` field.
  - Both clients `scene.start(MISSION_SELECT, { mode: VERSUS, multiplayer: handoff })`.
- MissionSelectScene changes:
  - When `mode === VERSUS`, hide the campaign life/start-phase controls and the arcade-only company affiliation override (each player keeps their own saved affiliation, no override).
  - Wallet spend on rerolls / favors / contracts is identical to arcade — no sandbox wallet.
  - Replace the lone DEPLOY button with `LOCK IN` plus a peer-status pill (`OPPONENT BRIEFING…` / `OPPONENT LOCKED`).
  - On LOCK IN: broadcast new `MATCH_BRIEFING_READY` event.
  - When both peers are LOCKED: host broadcasts `MATCH_DEPLOY` with the real countdown delay; both transition to GameScene with their own loadout payload + the versus handoff.
- GameScene reads its own selected favors / mission cards as today; opponent's loadout is not transmitted (no need — mirror is read-only).
- Edge case: a peer can UNLOCK before the other locks, identical pattern to the existing READY toggle.

### Phase F — Cleanup, verification, docs

- `npm.cmd run build` after each phase.
- Manual two-window dev playtest: full E2E covering briefing → match → spectate → result → rematch.
- Update `docs/state.md` and add a session log per phase or per ship.
- Add decision entries to `docs/decisions.md` for the locked design calls (extract-required win, sabotage laser cross-lane, spectate-until-peer-ends, versus uses real wallet, asymmetric loadouts).

## Scope boundaries

Out of scope for this plan:
- Sabotage laser manual aim (random lane is MVP).
- Multiple simultaneous sabotage charges (one held at a time).
- Ranked or tracked versus leaderboard (still local-only).
- Shared seed RNG / shared waves.
- Reconnect after disconnect mid-match.
- Voice/quick-chat in spectate mode.
- More than one sabotage power-up type.
- Spectate hard timeout (per user decision).
- Versus sandbox wallet (per user decision — uses real wallet).

## Open questions

- Sabotage laser tint: reuse Regent red so it looks like a "laser strike" similar to gunship guns, or a distinct violet to read as "from the other player"? Default to violet for now, fall back to red if violet conflicts with palette swaps.
- Briefing-screen wallet protection: if peer hard-disconnects after you spent on a favor, do we refund? MVP says no, current arcade also has no refund on abandon.
- Spectate viewport: full arena scaled to full screen, or maintain a small local "you are here" chip in the corner? Default to chip with local outcome.
- Mission rewards on a draw: do mission completions still pay out for the side that completed them? MVP says yes — missions are earned regardless of versus outcome, since each side ran their own loadout.

## Suggested ship order (smallest first)

1. **Phase A** — rematch ghost-ship fix (low risk, high user-visible value).
2. **Phase B** — extract-required win (logic-only, no new entities).
3. **Phase C** — spectate-until-peer-ends (UI + render reuse, no new net events).
4. **Phase D** — sabotage laser (new entity + new event, full versus-only feature).
5. **Phase E** — MissionSelect reuse (touches the most existing flows; ship last so prior phases stabilize first).
6. **Phase F** — verification + docs sweep.
