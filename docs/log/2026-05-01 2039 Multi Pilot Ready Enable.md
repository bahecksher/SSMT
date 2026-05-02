# 2026-05-01 2039 Multi Pilot Ready Enable

## TL;DR
- What changed: READY now enables for active 2-4 pilot rooms, and host countdown can begin when all active pilots are ready.
- Why: User reported the lobby recognized other pilots but READY could not be pressed.
- What didn't work: The full in-run multi-player result/spectate model is still pending; current runtime follows a primary rival.
- Next: Convert GameScene remote peer state to maps keyed by player id.

---

## Full notes

Changes:

- Relaxed `MenuScene` READY gating from exactly two active pilots to any active roster with at least two pilots.
- Relaxed host countdown gating from exactly two pilots to all active pilots ready.
- Added optional `senderId` to snapshot, laser, repulsor, extract, and death payloads.
- Added optional `targetId` to laser and repulsor payloads.
- Outgoing GameScene payloads now include sender id, and sabotage events target the current primary rival.
- Incoming snapshots and terminal events are filtered to the current primary rival, preventing three/four player rooms from corrupting the old single-peer mirror buffer.
- Incoming sabotage ignores self-sent events and ignores target-specific events meant for someone else.

Verification:

- `npm.cmd run build` passes.

Important limitation:

- This makes 2-4 rooms able to ready and start, but the in-run experience is not fully 4-player yet. The current mirror/result flow is still primary-rival-only until peer maps and ranked results are implemented.
