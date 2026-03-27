# 2026-03-27 0131 Semi-Live Result Overlays

## TL;DR
- What changed: Replaced death/extraction scene handoffs with semi-live in-scene result overlays that sit on top of the ongoing arena simulation.
- Why: Hard cuts to a separate result scene broke the cohesion of the run. Keeping the arena alive underneath makes the result feel like part of the same event.
- What didn't work: I did not add extra destruction/extraction-specific background choreography yet; this is a structural change first.
- Next: Playtest the pacing and readability of the result overlays, especially on mobile.

---

## Full notes

- Added a `RESULTS` state in `GameScene` so the world can keep updating while player input, scoring, extraction, pickups, and death checks stay disabled.
- Death and extraction now still use the existing red/green wipe feel, but the wipe resolves into an in-scene overlay instead of switching to `GameOverScene`.
- Added result UI inside `GameScene` with `DESTROYED` / `EXTRACTED`, score/best text, `TAP TO RETRY`, and `MENU`.
- Bound scene cleanup to shutdown events so restarting or returning to menu still disposes systems and graphics correctly now that manual cleanup is no longer tied to result transitions.
- Verification: `npm.cmd run build`
