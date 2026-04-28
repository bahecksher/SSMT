# 2026-04-27 2324 Menu Leaderboard Header Moved

## TL;DR
- What changed: moved the shared menu leaderboard header so `WEEKLY LEADERBOARD` now sits below the `ARCADE` button instead of above the mode buttons.
- Why: the user wanted the leaderboard title visually attached to the leaderboard area, not floating above the mode selector.
- What didn't work: nothing blocked the change; this pass is build-verified only.
- Next: browser-playtest the menu stack on narrow and desktop layouts to make sure the moved header still feels balanced with the tabs and comm panel.

---

## Full notes

- Reordered the `MenuScene` Y layout so the mode buttons come first, then the shared leaderboard title, then the `PILOTS` / `CORPS` tabs and board content.
- Kept the same shared title object for both arcade weekly boards and the campaign local board.
- Ran `npm.cmd run build` successfully after the change.
