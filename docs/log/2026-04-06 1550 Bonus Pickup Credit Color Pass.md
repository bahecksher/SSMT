# 2026-04-06 1550 Bonus Pickup Credit Color Pass

## TL;DR
- What changed: aligned both mining-bonus and standard credit-bonus pickups to the same color as the top HUD `CREDITS` readout
- Why: the two bonus pickups were still on older yellow/orange hardcoded colors and no longer matched the current credit language
- What didn't work: nothing major; this was a straightforward shared-color cleanup
- Next: playtest the pickups in motion and make sure the consistent green read still feels clear against salvage and the blue-led board

---

## Full notes

Updated `BonusPickup` to use `COLORS.SALVAGE` for both pickup variants instead of keeping separate hardcoded yellow/orange bonus colors. The mining-bonus icon still uses its chunk silhouette and the standard bonus still uses the diamond silhouette, but both now follow the same shared credits color thread and update automatically with palette changes.
