# 2026-04-14 0023 Corporation Leaderboard and Affiliation

## TL;DR
- What changed: Added a corporation leaderboard view in the menu, aggregated corporation score totals from tagged leaderboard rows, and tinted the gameplay arena exterior/border from the pilot's affiliated corporation.
- Why: The user wanted corporations competing against each other and a visible in-run read of which corporation the pilot is effectively flying for.
- What didn't work: I started to explore removing campaign mode, but the user redirected before that became the session goal, so those edits were reverted and not pursued.
- Next: Playtest the corporation board against live Supabase data and decide later whether rep-driven affiliation should stay or be replaced with an explicit corporation choice flow.

---

## Full notes

- Reused the existing company rep model instead of adding a new enlistment UI. Affiliation is currently inferred from the pilot's highest saved company rep.
- Added a `PILOTS` / `CORPS` toggle to the menu leaderboard while preserving the existing daily and weekly period tabs.
- Added corporation leaderboard aggregation in `LeaderboardService`, including paging through score rows so the board does not silently stop after a single 1000-row batch.
- Kept the existing per-pilot leaderboard intact, including company color/tag display where `company_id` is present.
- Used the inferred affiliation to drive a footer label on the corporation board and to tint the gameplay arena exterior and border with the affiliated corporation color.
- Confirmed the project still builds successfully with `npm.cmd run build`.
