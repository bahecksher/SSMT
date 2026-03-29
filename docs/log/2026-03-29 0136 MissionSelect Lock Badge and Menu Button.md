# 2026-03-29 0136 MissionSelect Lock Badge and Menu Button

## TL;DR
- What changed: Moved the `LOCKED` favor badge to the lower-right of each locked favor card and reduced the MissionSelect `MENU` button size so it no longer covers the briefing title.
- Why: The lock marker felt misplaced at the top-right, and the MissionSelect menu button was crowding the `MISSION BRIEFING` header on smaller screens.
- What didn't work: Nothing blocked the fix; this was a small layout cleanup.
- Next: Check MissionSelect on a phone-sized viewport to make sure the new lock badge position still reads clearly and the smaller menu button remains easy to tap.

---

## Full notes

- Reduced the MissionSelect menu button footprint and pinned it higher in the top-left so it clears the briefing heading.
- Kept the `SELECTED` and `SHORT` badges where they were, but moved the `LOCKED` badge down to the lower-right edge of the favor card.
- Left a small gap above the rep progress bar so the moved lock badge does not sit directly on top of it.
- Verified the project still builds successfully with `npm.cmd run build`.
