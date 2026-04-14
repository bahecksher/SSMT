# Plan - Corporation Leaderboard and Affiliation
_Created: 2026-04-14 0023_

## Goal
Ship a corporation leaderboard that compares company performance directly and make the pilot's current affiliation legible through the arena presentation.

## Approach
- Reuse the existing company rep model to infer a pilot's current affiliation from highest saved rep.
- Add leaderboard aggregation for corporation totals from submitted score rows that already carry `company_id`.
- Extend the menu leaderboard UI with a `PILOTS` / `CORPS` view toggle while preserving daily and weekly tabs.
- Tint the gameplay arena exterior and border using the affiliated corporation palette so the active allegiance reads immediately in-run.
- Verify the change with a production build.

## Scope boundaries
- No explicit corporation selection screen
- No campaign-mode overhaul or removal
- No redesign of company missions, favors, or rep thresholds
- No backend migration work beyond documenting the `company_id` dependency

## Open questions
- Whether highest-rep affiliation is enough long-term or should later be replaced by an explicit enlistment choice
- Whether the corporation board should eventually rank by total score, average score, wins, or a different rivalry metric
