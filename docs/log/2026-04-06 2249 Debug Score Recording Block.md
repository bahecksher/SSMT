# 2026-04-06 2249 Debug Score Recording Block

## TL;DR
- What changed: Using the pause-menu debug phase jump now invalidates the current run for score recording and surfaces that state in both the pause UI and result screen.
- Why: The new phase jump was useful for boss testing, but it needed a blocker so debug-assisted runs could not affect leaderboard, best score, wallet payout, or campaign lives.
- What didn't work: A leaderboard-only block would still have allowed wallet/best-score/progression side effects, so the run needed a single invalidation flag carried through the death/extraction result flow.
- Next: Use the blocked debug runs for boss tuning, then decide if the same invalidation concept should apply to any future spawn/debug cheats.

---

## Full notes

- Added a run-level `scoreRecordingBlocked` flag in `GameScene`.
- The flag is set when a phase jump button is used from the pause menu.
- Death flow now skips arcade loss submission and campaign life consumption when the run was invalidated by debug use.
- Extraction flow now skips:
  - best-score save
  - leaderboard submission
  - wallet payout
  - mission claim / extraction-side progression commit
- Pause menu now warns that using the debug jump blocks score recording.
- Result screen now explicitly calls out `DEBUG RUN // SCORE NOT RECORDED`.
- Verified with `npm.cmd run build`.
