# 2026-04-29 1016 Versus Multiplayer Phase 4 Terminal Events and Result Screen

## TL;DR
- What changed: Phase 4 of mirrored versus. Added `MATCH_EXTRACT` / `MATCH_DEATH` broadcast events on `NetSystem`, hooked them into `GameScene.handleDeath` / `handleExtraction`, built a side-by-side WIN/LOSE/TIE result screen, added a 15s peer-wait flow for the lone-extractor case, and hid the mirror PIP once the run reaches `RESULTS`.
- Why: Phase 1–3 had snapshot mirroring but no terminal-state signal — neither peer knew when the match was over. Score wasn't compared. Versus runs hit the standard `showResultUi` (RETRY / MENU) which is wrong for versus (no leaderboard write, no payouts, but a winner/loser banner is the whole point).
- What didn't work: Considered driving the result swap from a single state machine inside the existing `enterResultsState`. Rejected: the existing `showResultUi` pulls in mission progress, wallet payouts, and rep flux that none apply in versus. Cleaner to fork into `enterVersusResultFlow` / `showVersusResultUi` and leave the original path alone (already gated by `RunMode.VERSUS` blocking score recording).
- Next: Phase 5 lobby polish + Phase 6 mobile. Stable enemy IDs in snapshots if the index pair-up shimmer is noticeable. Stacked-layout mirror variant.

---

## Full notes

### Decisions settled before code (plan revision 2026-04-29 1009)

1. **Lone-terminal timeout** — local death + peer alive resolves immediately as LOSE (peer outlived). Local extract + peer alive waits up to **15s**; on timeout, declares WIN by uncontested extract. Peer terminal arriving cancels the timer.
2. **Tiebreaker on equal score** — extract beats death always. Same outcome + equal score = TIE. No earlier-`t` tiebreak.
3. **Rematch** — out for MVP. MENU only. Each peer leaves the channel via existing `cleanup()` on scene change.

Full rationale + state-machine diagram in `docs/plans/2026-04-29 1009 Plan revision - Mirrored Versus Multiplayer Phase 4 decisions.md`.

### Wire format

`src/game/systems/NetSystem.ts`:

```ts
NET_EVENT.MATCH_EXTRACT  // { score, time, rep? }
NET_EVENT.MATCH_DEATH    // { score, time, cause: 'asteroid' | 'enemy' | 'laser' }
```

`time` = ms since match start, same convention as `MirrorSnapshot.t`. `rep` reserved for future rep-flux summary, not rendered yet. Score is the *combined* banked + unbanked at the moment of the event (matches what the snapshot stream was already broadcasting).

### Broadcast sites (`GameScene.ts`)

- `handleDeath` — broadcast right before the screen-wipe → `enterResultsState` chain, *after* the campaign-soft-respawn early-return. Soft respawn is campaign-only and versus forces `RunMode.VERSUS`, but the placement defends against any future cross-mode mistake. Guarded by `localTerminalFired` to prevent double-fire.
- `handleExtraction` — broadcast right before screen wipe. Same flag-guard.

### Receiver wiring (`setupMultiplayer`)

```ts
session.onBroadcast(NET_EVENT.MATCH_EXTRACT, payload => {
  if (this.peerOutcome) return; // first-write-wins
  this.peerOutcome = { cause: 'extract', ... };
  this.onPeerTerminal();
});
// + analogous MATCH_DEATH listener
```

`onPeerTerminal` only triggers `renderVersusResult` when *both* `localTerminalFired` AND `state === RESULTS`. The state guard matters: terminal events broadcast *before* the death/extract screen wipe (so peer gets the signal as early as possible), which means peer terminal can arrive while we're still inside the wipe. Without the guard we'd render the result panel on top of the wipe overlay. With the guard, the peerOutcome is just stashed; `enterVersusResultFlow` picks it up when `enterResultsState` finally fires.

### Match-end flow

`enterResultsState` now branches on `multiplayer && localOutcome`:

```ts
if (multiplayer && localOutcome) {
  enterVersusResultFlow();
} else {
  showResultUi(resultData);
}
```

`enterVersusResultFlow`:
- Both terminal → render result now.
- Local death + peer alive → render now (LOSE; peer outlived).
- Local extract + peer alive → show waiting panel + start 15s timer. Peer terminal arrival or timeout both call `renderVersusResult`.

`renderVersusResult` is idempotent (`versusResultRendered` flag). On render, peer falls back to a synthetic `survived` outcome if no terminal arrived, with score pulled from the latest peer snapshot.

### Banner rule

```
extract beats death/survived. same kind compares by score. equal = TIE.
```

`decideVersusBanner(local, peer)` returns `'WIN' | 'LOSE' | 'TIE'`.

### Result UI shape (`showVersusResultUi`)

Reuses the same panel/title-bar styling as `showResultUi` so it feels native. New layout:

- Title bar: WIN (gate green) / LOSE (hazard red) / TIE (hud cyan).
- Two columns split at `centerX` with a thin vertical divider: `YOU` left, `P2` right.
  - Header (bold).
  - Score (large, salvage gold, fit-to-width).
  - Outcome line: `EXTRACTED` / `DESTROYED — <CAUSE>` / `STILL ALIVE`.
  - Phase reached (small, dim hud).
- Footer note: `VERSUS // NO RECORDS OR PAYOUTS` (consistent with the existing versus `showResultUi` footer copy).
- Single MENU button. No retry, no leaderboard — already gated by `RunMode.VERSUS`.

Compact mode kicks in below 430×760 (matches `showResultUi` thresholds).

### Mirror PIP cleanup

Two-step:
1. `enterResultsState` calls `setMirrorVisible(false)` to hide bg / entities / label / waiting.
2. `updateMirrorViewport` early-returns when `state === GameState.RESULTS`, so the per-frame redraw can't re-show the WAITING text or repaint entities.

PIP objects still live in the scene (destroyed by `teardownMultiplayer` on `cleanup()`). This addresses the Known Issue from the Phase 3 log.

### Files touched

Modified:
- `src/game/systems/NetSystem.ts` — added `MATCH_EXTRACT` / `MATCH_DEATH` constants + `MatchExtractPayload` / `MatchDeathPayload` interfaces.
- `src/game/scenes/GameScene.ts` —
  - New imports: `MatchExtractPayload`, `MatchDeathPayload`.
  - New `VersusOutcome` interface.
  - New constant `VERSUS_PEER_WAIT_MS = 15000`.
  - New fields: `localTerminalFired`, `localOutcome`, `peerOutcome`, `versusResultRendered`, `versusPeerWaitTimer`.
  - Reset all five in `create()`.
  - `setupMultiplayer` adds two new broadcast listeners + helpers (`getLatestPeerPhase`, `getLatestPeerScore`, `broadcastLocalTerminal`, `onPeerTerminal`, `cancelVersusPeerWait`).
  - `handleDeath` + `handleExtraction` broadcast terminal payload (guarded).
  - `enterResultsState` hides mirror + branches into `enterVersusResultFlow` for versus.
  - New `enterVersusResultFlow`, `decideVersusBanner`, `showVersusWaitingUi`, `renderVersusResult`, `showVersusResultUi`, `setMirrorVisible`.
  - `updateMirrorViewport` early-returns on RESULTS.
  - `teardownMultiplayer` calls `cancelVersusPeerWait`.

Added:
- `docs/plans/2026-04-29 1009 Plan revision - Mirrored Versus Multiplayer Phase 4 decisions.md` — locked-in design.

### Verify

1. `npm.cmd run build` — passes (clean tsc + vite, 710ms).
2. `npm.cmd run dev` — running on http://localhost:5176/.
3. **Two-window playtest needs human driver** (cannot run from harness). Steps:
   - Both windows: menu mode toggle → VERSUS → START.
   - Window A: Create Room. Window B: Join Room with code. Both READY → countdown.
   - Force a terminal in each window (intentionally fly into asteroid for death, or run phases until extract gate appears).
   - Confirm both sides land on the side-by-side result panel with matching banner. Score / outcome / phase visible in both columns.

   Edge cases to spot-check:
   - Both die same frame → should resolve to score-compare, no waiting panel.
   - Local death first, peer still alive → local should immediately show LOSE (peer column "STILL ALIVE" until peer broadcasts).
   - Local extract first, peer still alive → local should show waiting panel with countdown. Either let it expire (WIN by timeout) or have peer go terminal during the wait (swap to actual side-by-side).
   - Mirror PIP gone the moment result appears.

### Risks / follow-ups

- **Browser playtest still owed.** Build-clean only. Realtime broadcast latency or Supabase rate-limit on the new event names hasn't been observed in two-window flesh.
- The waiting panel's countdown uses a 250ms repeating timer destroyed via the `resultUi` array (wrapped in a fake `GameObject`). Slightly hacky — works because `clearResultUi` only calls `obj.destroy()`. If `resultUi` ever gains a typed iteration, swap to a tracked `Phaser.Time.TimerEvent` field.
- "Local death + peer alive → LOSE immediately" means we don't surface peer's eventual outcome at all on the loser's screen. By design (plan revision), but if a playtester finds it abrupt, an alternative is to show the LOSE banner immediately and update the P2 column live as their snapshots roll in until they extract / die.
- Versus runs no longer have a "RETRY" option from the result screen. MVP-intentional. If retry is asked for, lobby reentry with the same room code is the cleanest implementation.
- Score compare uses *combined banked + unbanked* at the moment of the event. Matches what the mirror PIP's score readout has been showing all along. If we want banked-only for the result, we'd need a second field on the payload.

### Phase 5+ starting points

- Lobby polish on mobile (Phase 6).
- Stable enemy IDs in MirrorSnapshot to fix index-pair shimmer.
- Stacked-layout PIP variant.
- Versus "rematch" flow if requested (rebroadcast `match_start` from the current room).
