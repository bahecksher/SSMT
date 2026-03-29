# 2026-03-29 0134 Mobile Menu Spacing Cleanup

## TL;DR
- What changed: Reflowed the main menu header stack for short screens, moved the settings button into a safer top-right position, and gave the leaderboard section cleaner spacing.
- Why: On mobile, the settings button was sitting over the title and the `BEST` / `LEADERBOARD` / tab area was too cramped.
- What didn't work: Nothing blocked the change; this was a focused layout pass.
- Next: Check the menu on an actual short phone viewport to see whether the new spacing still feels balanced with the leaderboard list visible.

---

## Full notes

- Replaced the fixed percentage spacing in the top menu stack with measured vertical spacing based on the actual rendered text heights.
- Reduced some title and leaderboard sizing on smaller screens so the menu breathes more naturally without collisions.
- Narrowed the leaderboard tabs slightly on compact layouts and tied the leaderboard list start position to the tab divider instead of a hardcoded screen percentage.
- Moved the settings button to a safer top-right anchor so it no longer sits on top of the game title on shorter screens.
- Verified the project still builds successfully with `npm.cmd run build`.
