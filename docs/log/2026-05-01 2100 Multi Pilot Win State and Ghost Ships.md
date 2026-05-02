# 2026-05-01 2100 Multi Pilot Win State and Ghost Ships

## TL;DR
- What changed: 3-4 player Versus now resolves to a final ranked result UI when every pilot has reached terminal state (extract or death). Live play also draws color-coded ghost ships for every other pilot inside the local arena.
- Why: previous build just hung on the live-standings spectate screen forever once the local pilot terminated, even after every other pilot finished. Players also asked for visibility into where peers are during the active match.
- What didn't work: n/a — straightforward additive changes.
- Next: smoke-test 3-4 browser sessions to confirm the win-state transition fires and ghost ships render with distinct colors.

---

## Full notes

### Win state for 3-4 player Versus

`GameScene` already accumulated peer outcomes in `peerOutcomeMap` but only ever transitioned to `renderVersusResult` from the 1v1 path (peer extract/death of the primary peer). In multi-pilot mode `enterVersusResultFlow` and `onPeerTerminal` simply called `showMultiPilotWaitingUi` and never resolved.

Added:
- `checkMultiPilotAllTerminal()`: returns true when local has an outcome and every non-local active roster pilot has an entry in `peerOutcomeMap`.
- `maybeResolveMultiPilotResult()`: bails unless multi-pilot, in RESULTS state, and not already rendered. If all-terminal, calls `renderVersusResult`; otherwise refreshes the waiting standings.
- `MATCH_EXTRACT` / `MATCH_DEATH` broadcast handlers now call `maybeResolveMultiPilotResult()` for non-primary senders (primary still routes through `onPeerTerminal`, which itself now calls `maybeResolveMultiPilotResult` in the multi-pilot branch).
- `broadcastLocalTerminal` calls `maybeResolveMultiPilotResult()` after broadcasting, covering the case where peers terminated first.
- `enterVersusResultFlow` (multi-pilot branch) checks all-terminal up front and renders immediately when that's already true, otherwise enters spectate + waiting UI as before.
- `renderVersusResult` now branches into the new `showMultiPilotResultUi` when multi-pilot.
- Presence handler synthesizes a `death` outcome (with last known peer score / phase) for any roster pilot who leaves before terminating, so a disconnect cannot stall the resolve.

`showMultiPilotResultUi` renders a banner (WIN / LOSE / DRAW based on top row), a ranked standings table reusing `getVersusPilotRows`, the no-records note, and a single MENU button (no rematch flow yet for 3-4p).

### Ghost ships in live arena

`updateLiveMirrorShip` only rendered the primary peer's ship from `peerSnapshots`. Reworked it to:
- Render all peers from `peerSnapshotMap` when in multi-pilot mode (each in its sender color, slightly more opaque than before so multiple ghosts are readable against local hazards).
- Fall back to `peerSnapshots` for 1v1 (unchanged behavior).

Local enemies, drifters, etc. still render through their own paths, so the user-visible result is: their own arena with all other pilots' ships overlaid as transparent triangles, plus their normal enemy/asteroid/laser feed.

## Verify
1. `npm.cmd run build` — passes.
2. Open 3-4 browser sessions; create + join a Versus room; ready up; deploy.
3. Expect: each pilot can see ghost ships of all the others in their own arena, in the room colors.
4. Have all pilots either extract or die. The live standings spectate screen should switch to a `FINAL STANDINGS` ranked table once the last pilot terminates.
5. Have one pilot disconnect mid-run before terminating. Expect: their pilot is treated as DESTROYED with their last known score so the remaining pilots can still resolve.
