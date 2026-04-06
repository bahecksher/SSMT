# 2026-04-06 1321 Favor Card Height Pass

## TL;DR
- What changed: Slimmed the Mission Select favor cards down to the same height class as the mission cards.
- Why: The user wanted the favor cards to feel tighter and match the mission-card size.
- What didn't work: Nothing blocked implementation.
- Next: Playtest compact screens and confirm the favor-card text still fits comfortably at the slimmer height.

---

## Full notes

- Updated `getBriefingLayoutConfig()` in `src/game/scenes/MissionSelectScene.ts` so the favor-card height is driven by the mission-card height instead of the older larger favor-card target.
- Kept the stacked-height fallback in place so very tight screens can still compress instead of blowing up the layout.
- Left the rest of the favor-card behavior intact; the slimmer height mainly pushes that section into its existing dense layout treatment.
- Verified with `npm.cmd run build`.
