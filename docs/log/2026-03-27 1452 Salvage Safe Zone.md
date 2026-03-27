# 2026-03-27 1452 Salvage Safe Zone

## TL;DR
- What changed: Salvage no longer kills the player and no longer uses proximity-based scoring.
- Why: User wanted salvage to behave like a free-floating scoring field that both the player and NPCs can pass through safely.
- What didn't work: Nothing blocked; build passed after removing salvage from the player collision path and flattening its score payout.
- Next: Playtest whether the flat salvage payout feels good relative to asteroid mining.

---

## Full notes

- Removed salvage from player death checks so only asteroids, enemies, and beams can kill the player now.
- Simplified salvage scoring back to a flat payout anywhere inside the salvage radius.
- Kept rare salvage more valuable by preserving its multiplier, but removed the extra edge/core proximity bonus.
- Left salvage depletion, drifting, shatter behavior, and NPC interaction intact.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
