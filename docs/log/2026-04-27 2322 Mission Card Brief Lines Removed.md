# 2026-04-27 2322 Mission Card Brief Lines Removed

## TL;DR
- What changed: removed the liaison/NPC flavor brief line from each MissionSelect mission card.
- Why: the user wanted those on-card NPC lines gone because they were unnecessary clutter.
- What didn't work: nothing blocked the change; this pass is build-verified only.
- Next: browser-playtest MissionSelect to make sure the cleaner cards still feel balanced on narrow layouts.

---

## Full notes

- Deleted the `getMissionBrief(...)` card text from `src/game/scenes/MissionSelectScene.ts`.
- Left the actual contract title, acceptance toggle, credit payout, and rep payout untouched.
- Ran `npm.cmd run build` successfully after the change.
