# 2026-03-27 1525 NPC Shield Collision

## TL;DR
- What changed: Added shield-vs-no-shield player/NPC collision rules in both directions.
- Why: User wanted shielded NPCs to kill unshielded players, and shielded players to kill unshielded NPCs while losing the shield.
- What didn't work: Nothing blocked; build passed after updating the player/NPC collision rule.
- Next: Playtest whether these outcomes feel readable and fair once more shielded NPCs show up in later phases.

---

## Full notes

- Added the new rules in `GameScene`'s existing player/NPC contact path rather than creating a separate collision system.
- If an NPC has a shield and the player does not, touching that NPC now destroys the player.
- If the player has a shield and the NPC does not, touching that NPC now destroys the NPC and consumes the player's shield.
- Shield-vs-shield and no-shield-vs-no-shield contacts still fall through to the existing bump behavior.
- Player-caused NPC kills through this rule do not spawn shield or bonus drops.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
