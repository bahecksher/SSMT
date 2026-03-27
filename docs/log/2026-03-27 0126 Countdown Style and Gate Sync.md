# 2026-03-27 0126 Countdown Style and Gate Sync

## TL;DR
- What changed: Restyled the start countdown to match the HUD/scoring hologram feel more closely, changed the animation so each number grows through its own second, and synced the entry gate close timing to the 3-second countdown.
- Why: The countdown felt visually disconnected from the rest of the UI, and the starting gate timing was not aligned with the visible countdown.
- What didn't work: No live tuning pass yet on whether the countdown should be even larger or brighter on smaller phones.
- Next: Playtest readability and pacing on desktop and mobile, then tune size/glow if needed.

---

## Full notes

- `GameScene` countdown text now uses the same `monospace` family and HUD color language instead of the previous brighter splash-screen styling.
- The countdown animation now ramps scale upward linearly over each second, then resets when the number changes, which matches the intended `3`, `2`, `1` grow/reset feel.
- `ExitGate` now accepts an optional duration so the entry gate can use the same 3000ms timing as the countdown while gameplay extraction gates keep their normal timing.
- Verification: `npm.cmd run build`
