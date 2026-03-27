# 2026-03-27 1552 Drone Interface Copy

## TL;DR
- What changed: Replaced remaining player-facing training-module wording with remote drone-interface language in the menu title block and Slick dialogue.
- Why: The game fiction is shifting away from a training sim and toward a live piloting interface for operating a drone.
- What didn't work: No code or systems changes were needed; this was a focused copy pass only.
- Next: Continue watching for any leftover training-sim phrasing in future content additions and docs rewrites.

---

## Full notes

- Menu subtitle now reads `REMOTE PILOT INTERFACE`.
- Slick's `menuIntro` line now says `Drone link is hot. Earn clean, extract cleaner.`
- Slick's death line now refers to losing a drone instead of learning in a sim.
- Searched `src/game` for `training`/`module` and found no remaining live game text matches.
- Verified with `npm.cmd run build`.
