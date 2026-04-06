# 2026-04-06 1549 NPC Single Threat Color Pass

## TL;DR
- What changed: removed the mixed NPC faction color variants and returned all NPC ships to a single red threat-thread color
- Why: the minority yellow/green/blue NPCs felt visually odd and diluted the threat read
- What didn't work: nothing major; this ended up being cleaner once the handoff color preservation was removed too
- Next: playtest the blue palette again and confirm the all-red NPC crowd feels clearer against the board and salvage colors

---

## Full notes

Simplified `NPCShip` so it always draws from `COLORS.NPC` instead of storing a per-ship hull variant. This keeps NPCs aligned with the active palette's dedicated NPC threat color and also means palette changes can update the read consistently.

Removed the extra NPC color field from menu, Mission Select, and gameplay handoff data so background NPCs no longer preserve old mixed colors when scenes transition. Debris still uses `getHullColor()`, so the shatter read stays aligned with the ship color without any special-case handling.
