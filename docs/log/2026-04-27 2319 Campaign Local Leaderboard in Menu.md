# 2026-04-27 2319 Campaign Local Leaderboard in Menu

## TL;DR
- What changed: Campaign mode now records a remembered local high score plus top local run list, and the menu shows that board in the shared leaderboard region when `CAMPAIGN` is selected.
- Why: the menu previously hid the leaderboard section for campaign, which made the mode selector feel incomplete and gave campaign no persistent score history.
- What didn't work: the first build failed on stricter Supabase fallback casts in the mode-filtered leaderboard fetch helpers; fixed by tightening the casts.
- Next: browser-playtest the menu mode swap and a full campaign game-over flow to confirm the local board feels balanced and updates at the right moment.

---

## Full notes

- Extended `SaveSystem` / `SaveData` with a persisted `campaignBestScore` plus a local top-10 `campaignLeaderboard`.
- On final campaign death, `GameScene` now records the campaign's total extracted credits and completed mission count into that local board before clearing the session.
- `MenuScene` now reuses the shared leaderboard slot: `ARCADE` keeps weekly pilot/corp boards, while `CAMPAIGN` shows `LOCAL CAMPAIGN BOARD` with a high-score line and saved local runs.
- `LeaderboardService` read paths now request `mode='QUICK'` for arcade boards when the backend column exists, and gracefully fall back to legacy unfiltered reads if the schema is still old.
- Ran `npm.cmd run build` successfully after the change.
