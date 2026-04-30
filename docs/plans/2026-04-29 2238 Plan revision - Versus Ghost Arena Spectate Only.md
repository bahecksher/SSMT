# Plan revision - Versus Ghost Arena Spectate Only
_Created: 2026-04-29 2238_
_Revises: docs/plans/2026-04-29 2234 Plan revision - Versus Sent Laser Mirror Echo.md_

## What changed
- The opponent ghost arena no longer renders during active local gameplay.
- The ghost arena and mirrored arena detail remain available during the post-run spectate/death waiting screen.

## Why
- The active playing screen was too visually busy with the ghost arena behind the main arena.
- The mirror is more useful after the local run ends, when the player is watching the opponent finish.

## Updated approach
- Keep sending and receiving mirror snapshots during live play so spectate has fresh data ready.
- Keep mirror display objects hidden and cleared while `versusSpectating` is false.
- Let `beginVersusSpectate()` promote and show the mirror as before.
