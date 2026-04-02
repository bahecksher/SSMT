# 2026-04-02 1813 Mission Tracker Slide Hide for Gameplay Comms

## TL;DR
- What changed: Replaced the mission tracker hard hide/show with a grouped slide-and-fade transition tied to gameplay comm visibility
- Why: The trackers disappearing instantly felt abrupt once comms moved into the same bottom lane
- What didn't work: The previous visibility toggle was functional but visually abrupt
- Next: Playcheck whether the upward slide distance and timing feel right on a phone-sized viewport

---

## Full notes

Added a dedicated mission pill container in `Hud` and moved visibility control to container-level animation instead of toggling each pill object's `visible` state directly.

When gameplay comms appear, the mission tracker group now slides upward slightly while fading out. When the comm clears, the group fades and slides back to its resting position. New pill renders also inherit the correct shown/hidden state immediately so mission progress updates do not cause flicker mid-comm.

Validation: `npm.cmd run build`
