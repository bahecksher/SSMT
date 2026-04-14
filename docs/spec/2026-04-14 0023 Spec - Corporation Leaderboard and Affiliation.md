# Spec - Corporation Leaderboard and Affiliation
_Created: 2026-04-14 0023_

## Goal
Add a corporation-vs-corporation leaderboard and make the pilot's current company affiliation visible in gameplay without introducing a separate enlistment flow yet.

## Core change
- Keep the existing pilot leaderboard.
- Add a second leaderboard view that aggregates scores by corporation for daily and weekly windows.
- Use the pilot's highest saved company rep as their current corporation affiliation.
- Reflect that affiliation in the game arena by tinting the exterior space and border with the affiliated corporation color.

## Leaderboard behavior
- The menu leaderboard keeps the existing daily and weekly periods.
- A new `PILOTS` / `CORPS` toggle switches between the per-pilot board and the aggregated corporation board.
- Corporation standings are based on the sum of tagged score submissions in the selected period.
- Corporation rows should show enough information to read the rivalry at a glance, including the company identity and cumulative performance.

## Affiliation rules
- A pilot's affiliation is determined by whichever company currently has the highest saved rep.
- If all company rep is zero, the pilot is considered unaffiliated.
- No separate corporation selection UI is added in this pass.
- Arcade leaderboard submissions continue to tag each run with the pilot's current affiliation at submission time.

## Visual identity
- During gameplay, the area outside the arena should visibly shift toward the affiliated corporation color.
- Arena border accents should also pick up the affiliated corporation palette.
- If the pilot is unaffiliated, the default neutral arena styling remains.

## Out of scope
- A manual corporation picker or enlistment contract flow
- Reworking how reputation is earned or spent
- Replacing the existing pilot leaderboard
- Server-side schema changes beyond the existing expectation that leaderboard rows can store `company_id`
