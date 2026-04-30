# Plan - Shared Versus Matchmaking Mode
_Created: 2026-04-29 2339_

## Goal
Add a server-authoritative shared-world versus foundation where both players can see and affect the same asteroids, salvage, gates, and sabotage lasers while preserving the existing mirrored versus mode as fallback.

## Approach
- Add a pure TypeScript shared-world simulation with stable network entity IDs, normalized arena coordinates, shared resource HP, per-player credit totals, shared gates, and world-targeted lasers.
- Add a PartyKit room server keyed by `roomCode + matchId` that owns simulation ticks and broadcasts snapshots/events.
- Add a browser WebSocket client for shared versus without adding a browser runtime dependency.
- Branch `GameScene` into shared-versus mode behind `VITE_SHARED_VERSUS=1` or `localStorage.ssmt_shared_versus = "1"`; if the PartyKit connection closes/errors, fall back to mirrored versus.
- Keep Supabase presence/lobby/results plumbing in place for now.

## Scope boundaries
- No ranked/anti-cheat hardening.
- No player-player ship collision or ship-to-ship damage.
- Existing arcade/campaign loops remain local-only.
- Enemies, NPCs, pickups, and boss behavior are not fully server-owned in this first shared-world foundation.

## Open questions
- Whether shared-versus should become the default once two-window manual testing is complete.
- Whether the next pass should prioritize server-owned enemies/NPCs or polish/rematch hardening first.
