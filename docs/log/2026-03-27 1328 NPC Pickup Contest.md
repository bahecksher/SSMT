# 2026-03-27 1328 NPC Pickup Contest

## TL;DR
- What changed: Restored bonus-point collectibles, removed their attraction-to-player behavior, and allowed NPCs to target/collect both shields and bonus collectibles.
- Why: User wanted the chase-down collectible back, but without magnetic pickup behavior, and wanted NPCs competing for those resources too.
- What didn't work: Nothing functional failed; one file needed a full rewrite because patch context was fighting text encoding.
- Next: Playtest whether NPC pickup competition feels fun or too aggressive.

---

## Full notes

- Reintroduced `BonusPickup` as a drifting collectible with expiry, but no attraction/magnet pull.
- `DifficultySystem` now queues physical bonus drops again for enemy kills and eligible NPC hazard deaths.
- `GameScene` now updates and resolves player/NPC pickup interactions for both shields and bonus collectibles.
- NPC target selection now considers nearby salvage, shields, and bonus collectibles rather than salvage alone.
- NPCs can now carry shields, visually show them, and consume them to survive one asteroid/enemy hit.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
