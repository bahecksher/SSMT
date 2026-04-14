# 2026-04-14 0101 MissionSelect Reputation Visibility

## TL;DR
- What changed: MissionSelect mission cards now show rep payout again, and favor cards now show current standing, raw rep, and progress toward the next tier.
- Why: The screen had lost key reputation context, so players could not easily judge contract value or current company favor.
- What didn't work: Nothing major failed; this was a targeted UI restoration pass.
- Next: Browser-playtest the compact MissionSelect layout and confirm displayed rep gains match awarded rep after extraction.

---

## Full notes

- Reintroduced mission rep gain visibility directly on contract cards while keeping the mission brief readable.
- Restored company standing visibility on favor cards using saved rep, current standing labels, and a thin next-tier progress bar.
- Kept the existing favor unlocks, prices, and selector behavior unchanged.
- Verified with `npm.cmd run build`.
