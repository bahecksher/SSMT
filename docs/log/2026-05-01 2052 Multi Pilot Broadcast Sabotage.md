# 2026-05-01 2052 Multi Pilot Broadcast Sabotage

## TL;DR
- What changed: Added 3-4 player broadcast sabotage mechanics, room colors, colored lasers, colored enemy spawns, and a live terminal standings screen.
- Why: User wanted 3-4 player death-screen interaction to affect all active players fairly, with one laser every 10s and one enemy spawn every 20s, while preserving 1v1 behavior.
- What didn't work: Final multi-player ranked result/rematch screen is still pending.
- Next: Add live opponent status cards while alive and a final 2-4 player ranked result table.

---

## Full notes

Implemented:

- Stable room colors in `NetSession`.
- Local Versus player ship uses assigned room color.
- `MatchLaserPayload` supports `senderId`, `targetId`, and `color`.
- New `MATCH_ENEMY` broadcast with `MatchEnemyPayload`.
- `MirrorSnapshot` carries `senderColor`; mirrored enemy and laser snapshots carry color.
- `VersusLaserStrike` accepts a custom color.
- `EnemyShip` accepts a custom hull color.
- 3-4 player terminal laser broadcasts to every active pilot by omitting `targetId`.
- 3-4 player terminal enemy spawn broadcasts to every active pilot by omitting `targetId`.
- 3-4 player terminal controls show LASER and ENEMY instead of LASER and REPULSOR.
- Laser charge max is 1 in multi-player terminal state and regenerates every 10s.
- Enemy-spawn charge max is 1 and regenerates every 20s.
- 1v1 keeps existing spectate/death-screen path and repulsor control.

Verification:

- `npm.cmd run build` passes.

Known limitations:

- The 3-4 player standings screen is a first pass. It updates live score/phase/state, but the final all-pilots-complete result/rematch table still needs its own design.
- Live players still need compact opponent cards so they can see score/phase pressure before dying.
