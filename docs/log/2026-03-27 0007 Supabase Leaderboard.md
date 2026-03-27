# 2026-03-27 0007 Supabase Leaderboard

## TL;DR
- What changed: Added online leaderboard using Supabase with daily/weekly score tabs on menu screen. Player identity is auto-generated arcade-style callsign (3 letters + 4 digits). Scores submitted to leaderboard on extraction only.
- Why: User wants persistent competitive leaderboard for players.
- What didn't work: Nothing — clean implementation.
- Next: Deploy to GitHub Pages, test end-to-end, continue to audio/settings (phase 6).

---

## Full notes

### Supabase setup
- User created Supabase project (djpliigclofvtfbzhkge)
- Provided SQL for `scores` table with RLS policies (public read, anonymous insert)
- Indexes on `created_at DESC` and `score DESC` for fast queries

### New files
- `src/game/services/supabase.ts` — Supabase client init with project URL and anon key
- `src/game/services/LeaderboardService.ts` — `fetchLeaderboard(period, limit)` and `submitScore(name, score)` functions

### Modified files
- `src/game/constants.ts` — added `PLAYER_NAME_KEY`
- `src/game/systems/SaveSystem.ts` — added `getPlayerName()` with auto-generation
- `src/game/systems/BankingSystem.ts` — calls `submitScore()` on extraction (fire-and-forget)
- `src/game/scenes/MenuScene.ts` — complete rewrite with leaderboard display, daily/weekly tabs, pilot name display

### Design decisions
- Fire-and-forget submission: no blocking on network, no retry
- Daily = last 24 hours, weekly = last 7 days (rolling window, not calendar-based)
- Top 3 entries highlighted in green (SALVAGE color), rest in cyan (HUD color)
- Menu layout compressed to fit leaderboard: title at 0.12–0.24, pilot/best at 0.30–0.34, leaderboard at 0.40–0.78, tagline+start at 0.83–0.88
