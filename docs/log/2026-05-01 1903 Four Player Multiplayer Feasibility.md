# 2026-05-01 1903 Four Player Multiplayer Feasibility

## TL;DR
- What changed: No code changes. Reviewed the current Versus architecture and assessed what four-player support would require.
- Why: User asked what it would take to make multiplayer host up to four players instead of only 1v1.
- What didn't work: Nothing blocked; this was an assessment only.
- Next: Decide desired multiplayer shape before implementation: parallel arenas, teams, or true shared arena.

---

## Full notes

Current Versus is built around Supabase Realtime presence and broadcast events. The existing implementation intentionally uses independent local simulations: each player owns their own arena, broadcasts a 10Hz mirror snapshot, and sends terminal extract/death events. Lobby, MissionSelect, GameScene mirror buffers, outcomes, and result UI all assume one peer.

Four-player support is most practical if it keeps the independent-arena model: one shared room with up to four presences, one local arena per player, per-opponent snapshot buffers, ranked terminal results, and room-wide sabotage/spectator events. This would be a meaningful but contained refactor.

A true shared arena with four ships interacting in one simulation is a much larger architecture shift. It would need server authority or a host-authoritative deterministic model, replicated inputs/state, reconciliation, anti-cheat decisions, and major changes to collision, scoring, enemies, bosses, and extraction.
