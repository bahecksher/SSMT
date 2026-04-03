# 2026-04-02 2135 Mission Favor Card Spacing and Deploy Cleanup

## TL;DR
- What changed: Reduced the MissionSelect favor-card height targets, increased the gap above the `DEPLOY` button, and removed the `DEPLOYS WITH ACCEPTED CONTRACTS + ARMED FAVORS` helper line
- Why: The user reported the fourth favor card crowding or overlapping the deploy area and asked to make all four cards thinner
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build`
- Next: Check MissionSelect on a real phone-sized viewport to confirm the new card stack has enough breathing room above `DEPLOY`

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested MissionSelect spacing cleanup.
- Updated `src/game/scenes/MissionSelectScene.ts` only.
- Lowered the favor-card target/min heights now that each card only carries two text lines, which gives the lower stack more room to breathe without changing favor selection logic.
- Increased the reserved gap between the last favor card and the deploy button so the bottom card no longer rides against the deploy area on short screens.
- Verified with `npm.cmd run build`.
