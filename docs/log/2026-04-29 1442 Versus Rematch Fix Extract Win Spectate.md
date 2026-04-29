# 2026-04-29 1442 Versus Rematch Fix, Extract-Required Win, Spectate Mirror

## TL;DR
- What changed: Shipped Phases A, B, C of the new versus plan. Fixed the rematch ghost-ship bug by stamping snapshots with a sender-clock epoch and resetting the receiver buffer on epoch change. Made extract a hard requirement to win — non-extract outcomes now resolve to DRAW. Replaced the post-run waiting panel with a fullscreen spectate takeover that keeps showing the peer's live arena until they end.
- Why: User-reported bug plus three feature decisions from the new versus design pass: extract-to-win, watch peer after own run ends, and rebuild MissionSelect-routed flow + sabotage laser on top of those.
- What didn't work: N/A — three phases applied cleanly, build is green after each.
- Next: Phase D (sabotage laser cross-arena power-up) and Phase E (versus uses MissionSelect with each side picking own loadout). Then a real two-window dev playtest pass.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

### Phase A — Rematch ghost-ship fix

Root cause: receiver-side filter `if (last && snap.t < last.snap.t) return;` discarded out-of-order snapshots based on sender-relative `t`. On rematch, the sender's `matchClockStartMs` resets so `t` restarts low, but the receiver still held the old round's high-`t` snapshot (e.g. extracted-pose at extract coords). New round's low-`t` snapshots got rejected as "out of order", so the peer ghost stayed frozen at the previous round's extract location.

Fix:
- `MirrorSnapshot` gets an optional `epoch: number` field (sender's `matchClockStartMs`).
- Sender stamps every snapshot with its current epoch.
- Receiver tracks `peerEpoch`. On any incoming snapshot whose epoch differs from the cached one, the receiver clears `peerSnapshots` before accepting the new one. This wipes the stale high-`t` pose and lets the new round's snapshots flow in normally.
- `epoch` is optional on the type so older clients without the field still work — null epoch means "skip the gate," fall back to the existing `t < last.t` filter.

Files touched:
- `src/game/systems/NetSystem.ts` (added `epoch` field to `MirrorSnapshot`)
- `src/game/scenes/GameScene.ts` (receiver `setupMultiplayer` epoch comparison; sender `sendSnapshot` stamps `epoch`; new `peerEpoch` member)

### Phase B — Extract-required win condition

Updated `decideVersusBanner`:
- Both extract → higher score wins, tie at equal score → DRAW.
- Extract vs death → extractor WINS.
- Both non-extract (death/death, death/timeout, etc.) → DRAW regardless of score.

Renamed banner string from `'TIE'` to `'DRAW'` per user wording.

Removed the early "local death + peer alive → resolve immediately as LOSE" fast path. Death now also enters the spectate/wait flow because the eventual outcome depends on whether the peer extracts (LOSE for us) or also dies (DRAW). The 15s `VERSUS_PEER_WAIT_MS` auto-WIN safety still fires only on the local-extract case so a stalling peer cannot pin the extractor on the result screen forever; on local-death, there is no auto-resolve, and the existing 3.5s `MATCH_RESULT_PULSE` heartbeat watchdog already handles peer-disconnect.

Files touched:
- `src/game/scenes/GameScene.ts` (`decideVersusBanner`, `enterVersusResultFlow`, `showVersusWaitingUi` copy)

### Phase C — Spectate-until-peer-ends

Replaced the full-arena post-run waiting panel with a fullscreen spectate takeover:

- New `versusSpectating` flag plus `beginVersusSpectate` / `endVersusSpectate` helpers in `GameScene`.
- Mirror layer depths get promoted during spectate (`MIRROR_SPECTATE_BG_DEPTH = 204`, entity `207`, text `211`) so the peer's arena renders ABOVE the result-screen backing instead of behind local frozen entities.
- `updateMirrorBackdrop` no longer hard-blocks on `state === RESULTS`; during spectate it keeps drawing with bigger ship/enemy radii (14 / 8 vs 8 / 4) and stronger alphas (~0.85 vs 0.3) so the peer is the dominant readable layer.
- New waiting UI is just a thin top header strip + corner status text + bottom MENU button. The middle of the screen is left open for the peer mirror.
- Local extract case: header reads `EXTRACTED`, status reads `AUTO-WIN IN Ns IF <PEER> STAYS ALIVE` — same 15s auto-resolve.
- Local death case: header reads `DESTROYED`, status reads `NO EXTRACT // BEST CASE DRAW IF <PEER> ALSO FALLS`. No timer. Waits for the peer's terminal event or the peer-left heartbeat.
- `renderVersusResult` calls `endVersusSpectate` to restore mirror depths + visibility before the both-terminal result screen draws.

Files touched:
- `src/game/scenes/GameScene.ts` (new spectate helpers, depth constants, `updateMirrorBackdrop` branch on spectate, `showVersusWaitingUi` rebuild, `enterResultsState` no longer hides mirror unconditionally)

### Build verification

`npm.cmd run build` passes after Phase A, after Phase B, and after Phase C.

### Out of scope this session

- Phase D: sabotage laser cross-arena power-up.
- Phase E: route versus through MissionSelect with each side picking own loadout.
- Manual two-window dev playtest of the new spectate UI and DRAW resolution paths.

### Risks / follow-up

- `versusSpectating` mirror depth promotion assumes the existing result-screen UI components stay in the 205–211 depth band. If a future result-screen redesign moves into the 200s above 207, the peer mirror could occlude it during spectate.
- Local death + peer alive path now waits indefinitely (no timer). If the peer-left heartbeat ever stops working, the dead local would be stuck on the spectate screen until they hit MENU. The `MATCH_RESULT_PULSE` watchdog handles this today (3.5s), but it's worth re-verifying during the next playtest.
- Spectate UI was not run with two real clients yet — only TypeScript-build-verified. The next session should confirm visually that the peer mirror reads as the dominant layer and that local frozen entities don't visually leak through enough to be confusing.
