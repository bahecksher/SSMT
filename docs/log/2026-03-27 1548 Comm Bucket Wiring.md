# 2026-03-27 1548 Comm Bucket Wiring

## TL;DR
- What changed: Wired unused Slick comm buckets into menu/gameplay events and added a phase-3 introduction gate for Regent before later Regent callouts can fire.
- Why: Direct line edits were not showing up because several buckets were defined but never actually used, and Regent needed a clearer first entrance before later taunts.
- What didn't work: There were no stale source files or broken imports causing the issue; the problem was event wiring and trigger timing.
- Next: Playtest the new trigger rates on desktop and mobile to make sure the extra chatter feels alive without getting noisy.

---

## Full notes

- `menuIntro` now appears occasionally on the menu via `SlickComm`.
- `phaseAdvance`, `shieldPickup`, `extraction`, `death`, and `gameOverRetry` now have live hooks in `GameScene`.
- Slick's new hooks use low trigger probabilities so they stay intermittent rather than firing every chance they get.
- Regent now always gets a first appearance when the run reaches phase 3.
- After that phase-3 introduction, later Regent follow-ups are gated and only some recurring lines fire occasionally.
- Enemy-arrival and beam-unlock Regent lines remain milestone-based, but they now only happen after Regent has been introduced.
- Verified with `npm.cmd run build`.
