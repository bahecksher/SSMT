# 2026-03-29 0116 Mission Card Deadspace Trim

## TL;DR
- What changed: reduced the mission-card height and tightened the footer placement so one-line missions no longer sit above a large empty lower area.
- Why: the briefing cards still felt visually tall and left too much dead space under the mission text.
- What didn't work: nothing blocked this pass.
- Next: verify the shorter mission cards on a phone viewport to make sure the denser stack still feels tappable.

---

## Full notes

- Lowered the MissionSelect mission-card height range so the cards hug the mission label more closely.
- Nudged the mission label and footer spacing to keep the card balanced after the height reduction.
- The shorter cards also pull the reroll/favor section slightly upward because the briefing stack now occupies less vertical space.
- Verified the change set with `npm.cmd run build`.
