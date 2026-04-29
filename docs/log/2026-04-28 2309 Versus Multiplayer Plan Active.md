# 2026-04-28 2309 Versus Multiplayer Plan Active

## TL;DR
- What changed: Wrote new plan `docs/plans/2026-04-28 2304 Plan - Mirrored Versus Multiplayer.md` and swapped `state.md` active plan to it. PC + Google Play ship plan paused.
- Why: User wants to explore 1v1 mirrored versus mode where each player runs own sim and sees opponent's arena as low-fidelity ghost from broadcast snapshots until extract/death. Transport = existing Supabase Realtime stack so no new backend.
- What didn't work: N/A — planning only this session, no code touched.
- Next: Phase 1 of plan — scaffold `NetSystem` (Supabase Realtime channel, presence, ready handshake) + lobby UI (Create/Join Room, ready-up, countdown).

---

## Full notes

### Conversation shape

User asked exploratory question about multiplayer scope. Compared two routes:

1. **Shared arena co-op** (Supabase Realtime broadcast, host-authoritative enemies, shooter-authoritative hits). Cheap but laggy hit-feel, host migration pain, music phase sync hard, cheat-prone.
2. **Mirrored versus** (each player full local sim, opponent rendered as ghost from snapshots, match ends at extract/death). Way easier — no shared physics, no hit reconciliation, no host migration.

User picked option 2.

### Plan authored

`docs/plans/2026-04-28 2304 Plan - Mirrored Versus Multiplayer.md` covers:

- **Phase 0** scope decisions: 1v1 only, code-based room join, no shared waves, portrait stacked viewports for MVP.
- **Phase 1** `NetSystem` + lobby + ready handshake.
- **Phase 2** `MirrorSnapshot` schema (`t`, `ship`, `enemies[]`, `score`, `phase`, `extracted`), 10Hz sender, no bullets in MVP.
- **Phase 3** mirror render scene/camera, ghost sprites, dimmed scaled half-viewport.
- **Phase 4** extract/death events, side-by-side result screen.
- **Phase 5** lobby polish (Create/Join, presence, countdown).
- **Phase 6** mobile portrait split tuning + stalled-peer indicator + forfeit handling.

Out of scope: PvP attacks between arenas, shared seed RNG, shared music phase, bullets, 3+ players, authoritative server, anti-cheat, versus leaderboard, reconnect, spectator.

Open questions logged in plan: portrait split vs PIP, versus runs polluting arcade leaderboard, Realtime free-tier message budget headroom (~1.7M/month for one always-on pair vs 2M cap), match length cap, unlock gating.

### State carryover

Prior focus (phone startup latency) is paused mid-validation:

- Build passes, `100ms` boot hold, font gate removed, late-load seek alignment in place.
- Cold-refresh phone playtest still owed.
- Manual Supabase SQL migration for `mode` / `company_id` columns still owed (`docs/sql/2026-04-28 1403 mode and company_id columns.sql` exists, untracked).

Carried these into Known Issues on `state.md` so the versus pivot does not erase them.

### No code changes

This session is plan + state + log only. Project remains in last session's runnable state.
