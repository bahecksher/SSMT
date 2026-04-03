# 2026-04-02 2139 Mission Header Job Board Pass

## TL;DR
- What changed: Renamed the MissionSelect header from `MISSION BRIEFING` to `JOB BOARD`, reduced the title size, and tightened the header spacing so the top title clears the `MENU` and `SETTINGS` buttons better
- Why: The user reported the menu/settings buttons sitting over the MissionSelect title
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build`
- Next: Check the MissionSelect top area on a real phone-sized viewport and trim further if the top buttons still crowd the title

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested MissionSelect header cleanup.
- Updated `src/game/scenes/MissionSelectScene.ts` only.
- Kept the rest of the mission/favor layout intact while rebalancing the top title and subtitle slot.
- Verified with `npm.cmd run build`.
