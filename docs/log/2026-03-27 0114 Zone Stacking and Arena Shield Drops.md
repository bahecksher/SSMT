# 2026-03-27 0114 Zone Stacking and Arena Shield Drops

## TL;DR
- What changed: Updated salvage/mining floating gain text to reflect actual stacked points earned during overlap, and blocked NPC hazard shield drops unless the pickup fits fully inside the arena.
- Why: Overlaps could look like they were not stacking correctly, and NPCs could leave shield pickups beyond the playable bounds.
- What didn't work: No automated gameplay test coverage yet for these edge cases; verification was build-only in this session.
- Next: Playtest mixed overlap scenarios and edge-of-arena NPC deaths in a live run.

---

## Full notes

- `SalvageSystem` now accumulates the real score earned between floating-text ticks, so overlapping salvage zones and overlapping mining zones show gain numbers that match the stacked payout more closely instead of using symbolic per-zone labels.
- `DifficultySystem` now validates hazard-killed NPC death positions against arena bounds before queuing a shield drop.
- Exported the shield pickup radius from `ShieldPickup` so the arena-bound check guarantees the entire pickup stays inside the play area rather than only checking its center.
- Verification: `npm.cmd run build`
