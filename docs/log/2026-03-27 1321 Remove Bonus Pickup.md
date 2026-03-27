# 2026-03-27 1321 Remove Bonus Pickup

## TL;DR
- What changed: Removed bonus-point pickup spawning and changed enemy/NPC bonus rewards to award immediately at kill time with the same large popup text.
- Why: User wanted the bonus-point pickup behavior gone while keeping the reward itself.
- What didn't work: Nothing functional failed; build passed after the code simplification.
- Next: Playtest whether the instant reward feels better than the collectible version.

---

## Full notes

- Deleted the `BonusPickup` entity and removed its update/cleanup path from `GameScene`.
- Simplified `DifficultySystem` so it queues immediate bonus awards instead of pickup spawn data.
- Enemy kills still always grant their bonus, and qualifying NPC hazard deaths still grant theirs based on the current chance.
- The large reward popup remains so kills still feel juicy without introducing another collectible object.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
