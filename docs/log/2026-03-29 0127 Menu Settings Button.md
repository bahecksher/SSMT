# 2026-03-29 0127 Menu Settings Button

## TL;DR
- What changed: Lowered the divider under the leaderboard tabs, replaced the top-right inline shake and scan text with a `SETTINGS` button, and added explicit `ON` and `OFF` buttons for both options.
- Why: The menu needed more breathing room around the leaderboard tabs and cleaner, easier-to-read settings controls.
- What didn't work: The first build caught a Phaser typing issue for the stored settings panel objects, which was fixed by tightening the local type.
- Next: Check the menu on a phone-sized viewport to confirm the settings dropdown placement still feels clean and tap-safe.

---

## Full notes

- Moved the leaderboard divider lower so the daily and weekly buttons have a little more separation from the line below.
- Replaced the always-visible `SHAKE` and `SCAN` text toggles in the top-right with a single `SETTINGS` button in the same area.
- Added a compact settings panel that opens from the menu and keeps shake and scan hidden until needed.
- Each setting now has dedicated `ON` and `OFF` buttons with a highlighted active state instead of text-only toggles.
- Clicking empty space while the settings panel is open closes it instead of accidentally starting the run.
- Verified the project still builds successfully with `npm.cmd run build`.
