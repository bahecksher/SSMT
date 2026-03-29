# 2026-03-29 0140 Favor Status Badge Consistency

## TL;DR
- What changed: Moved all favor-card status badges to the lower-right corner, not just `LOCKED`.
- Why: The favor screen should treat `SHORT`, `LOCKED`, and similar state callouts consistently.
- What didn't work: Nothing blocked the change; this was a small layout consistency pass.
- Next: Check the favor cards on a phone-sized viewport to make sure the lower-right badges still read clearly across locked, short, and selected states.

---

## Full notes

- Replaced the mixed badge placement logic with a single lower-right anchor for all favor-card status badges.
- This now keeps `SHORT`, `LOCKED`, and `SELECTED` in the same location instead of splitting states between the top and bottom corners.
- Verified the project still builds successfully with `npm.cmd run build`.
