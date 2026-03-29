# 2026-03-28 2326 Gameplay Comm Priority and Cooldown

## TL;DR
- What changed: Slick, Regent, and liaison gameplay comms now share one lane, use a shared cooldown, and no longer overlap
- Why: multiple comm panels were firing on top of each other during live gameplay, and Regent needed stronger priority once introduced
- What didn't work: liaison lines bypassed the existing exclusivity helpers, and several gameplay triggers were firing often enough to crowd each other
- Next: playtest a full run to tune the new pacing and confirm Regent interruptions feel right

---

## Full notes

- Added gameplay comm state in `GameScene` to track the active speaker, visible duration, and next time the lane is allowed to speak again.
- Routed live Slick, Regent, and liaison requests through shared helper methods instead of letting liaison show directly.
- Reduced several gameplay trigger chances for Slick and Regent lines, especially shield, gate, and phase chatter.
- Delayed liaison intro/boost lines until after the opening Slick line has fully cleared, and guarded those callbacks so they do not fire during death/results states.
- Kept death/extraction comms immediate by continuing to use the exclusive show path for those forced moments.
- Verified with `npm.cmd run build`.
