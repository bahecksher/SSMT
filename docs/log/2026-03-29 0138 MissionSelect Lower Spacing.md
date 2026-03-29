# 2026-03-29 0138 MissionSelect Lower Spacing

## TL;DR
- What changed: Added more space around the MissionSelect reroll button, wallet line, and favor grid, and narrowed the reroll button slightly.
- Why: The lower half of the briefing screen felt cramped and needed more breathing room.
- What didn't work: Nothing blocked the change; this was a focused spacing pass.
- Next: Check the MissionSelect screen on a phone-sized viewport to make sure the new spacing feels calmer without hurting tap comfort.

---

## Full notes

- Increased the gap between the mission cards and the reroll button on normal compact layouts while keeping a tighter fallback for very short screens.
- Added more vertical separation between the reroll button, the wallet line, and the favor cards so those sections read as clearer groups.
- Slightly widened the spacing between favor cards on roomier screens and narrowed the reroll button a bit so it sits with more margin around it.
- Verified the project still builds successfully with `npm.cmd run build`.
