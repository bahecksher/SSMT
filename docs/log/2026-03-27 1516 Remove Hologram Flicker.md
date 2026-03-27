# 2026-03-27 1516 Remove Hologram Flicker

## TL;DR
- What changed: Removed the random hologram flicker from the overlay and most gameplay entities.
- Why: User wanted the hologram look without the constant alpha popping.
- What didn't work: Nothing blocked; build passed after removing the flicker logic.
- Next: Playtest whether any remaining visual instability feels intentional or should also be flattened.

---

## Full notes

- Removed random alpha flicker from the global `HologramOverlay`.
- Removed per-entity alpha flicker from the player, asteroids, salvage, NPCs, enemies, gate, shields, and bonus pickups.
- Left beam warning flicker untouched because it functions as a hazard telegraph rather than ambient hologram noise.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
