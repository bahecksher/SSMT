# 2026-03-29 0057 Mission Card Trim Pass

## TL;DR
- What changed: removed the star row from mission cards, added per-contract rep gain beside the company name, and shortened the two summary lines under the mission stack.
- Why: the briefing still felt visually tall, and contract cards needed to surface rep reward more directly.
- What didn't work: nothing blocked the pass once the existing compact card layout was already in place.
- Next: check the updated MissionSelect layout on a short phone viewport to confirm the new spacing actually reads cleaner in practice.

---

## Full notes

- Removed the tier-star row from `MissionSelectScene` so the mission label can sit higher and the card loses one extra decorative strip.
- Added rep gain using mission tier values directly in the mission footer, displayed beside the company name.
- Shortened the wallet and deal summary copy below the mission stack and tightened the vertical gap before the favor grid.
- Verified the change set with `npm.cmd run build`.
