# 2026-04-02 1709 Menu Comm Placement Pass

## TL;DR
- What changed: Removed the old menu how-to-play instructions, moved Slick's menu comm placement into the gap beneath the leaderboard, and capped leaderboard rows so the panel has dedicated space
- Why: The user wanted the menu comms to live under the leaderboard and no longer wanted the old instructional copy on the menu
- What didn't work: No live device/browser playcheck yet this session; verification was limited to `npm.cmd run build`
- Next: Visually check the menu on desktop and a short phone viewport for leaderboard/comm/footer spacing

---

## Full notes

- Deleted the three-line "collect salvage / dodge hazards / extract" copy above `TAP TO START`.
- Added a `positionMenuComm()` helper in `MenuScene` so Slick's menu panel pins into the vertical gap between the leaderboard block and the footer prompt.
- Updated leaderboard rendering to reserve room for the comm panel beneath the score rows, and re-run the placement logic for loading, offline, empty, and populated leaderboard states.
- Verified with `npm.cmd run build`.
