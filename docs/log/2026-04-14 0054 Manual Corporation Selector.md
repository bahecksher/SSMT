# 2026-04-14 0054 Manual Corporation Selector

## TL;DR
- What changed: Replaced the read-only `WORKING WITH` text in the menu with a corporation selector button that cycles through `FREE AGENT` and the four corporations, and persisted that selection locally.
- Why: The user wanted a real way to choose which corporation they are working with instead of relying only on rep inference.
- What didn't work: Nothing notable; the build passed once the shared affiliation helper and menu selector were in place.
- Next: Playtest the selector with live leaderboard submissions and decide later whether the cycling button should grow into a richer corporation picker.

---

## Full notes

- Added a dedicated saved affiliation selection key in localStorage and shared helper logic in `companyData`.
- Manual affiliation selection now overrides highest-rep affiliation for leaderboard tagging and corporation-themed UI, with rep still acting as the fallback when no choice has been made.
- Replaced the menu affiliation line with a styled button in the same slot, using corporation-colored accents.
- Updated the corporation leaderboard footer so it can distinguish between `SELECTED` and `HIGHEST REP`.
- Confirmed the project still builds successfully with `npm.cmd run build`.
