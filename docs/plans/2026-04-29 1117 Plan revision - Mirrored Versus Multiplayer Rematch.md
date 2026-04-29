# Plan revision - Mirrored Versus Multiplayer Rematch
_Created: 2026-04-29 1117_
_Revises: docs/plans/2026-04-29 1009 Plan revision - Mirrored Versus Multiplayer Phase 4 decisions.md_

## What changed
- Rematch moved from deferred to shipped.
- The versus result screen now owns a two-peer rematch handshake instead of offering only `MENU`.

## Why
- Rematch was requested immediately after Phase 4 landed.
- The existing persistent realtime session and result-screen wait pattern made an in-place rematch cheaper than bouncing through the lobby again.

## Updated approach
- Reuse the same `NetSession` across rematches.
- Signal intent with `MATCH_REMATCH_READY` and `MATCH_REMATCH_CANCEL`.
- When both peers are ready, clear scene listeners, keep the channel alive, and restart `GameScene` with a fresh `MultiplayerHandoff`.
- Leave the lobby flow unchanged; do not add a "rejoin existing session" branch there.
