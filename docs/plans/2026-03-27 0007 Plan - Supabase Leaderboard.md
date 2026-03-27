# Plan - Supabase Leaderboard
_Created: 2026-03-27 0007_

## Goal
Add a persistent online leaderboard using Supabase with daily and weekly score tabs, displayed on the menu screen. Scores submitted on extraction only.

## Approach

### 1. Supabase client setup
- Install `@supabase/supabase-js`
- Create `src/game/services/supabase.ts` — initializes the Supabase client with project URL and anon key
- Create `src/game/services/LeaderboardService.ts` — handles fetching and submitting scores

### 2. Player identity
- On first play, generate: 3 random uppercase letters + 4 random digits (e.g. "XKR4281")
- Store in localStorage under `ssmt_player_name`
- `SaveSystem` gets a `getPlayerName()` / `ensurePlayerName()` method
- Name is immutable once generated (arcade style)

### 3. Score submission
- `BankingSystem.checkExtraction()` already calls `saveSystem.saveBestScore(banked)`
- After banking, also call `LeaderboardService.submitScore(playerName, bankedScore)`
- Submission is fire-and-forget (don't block extraction on network)

### 4. Menu screen leaderboard
- MenuScene layout restructured:
  - Title block stays at top (0.15–0.36)
  - Leaderboard section in middle (0.42–0.78) with DAILY / WEEKLY toggle
  - "TAP TO START" at bottom (0.85)
- Leaderboard shows top 10 entries: rank, name, score
- Fetched on scene create; shows "LOADING..." then renders
- If fetch fails, shows "OFFLINE" — game still works without network
- Daily = scores from last 24 hours; Weekly = scores from last 7 days

### 5. Files changed
- `package.json` — add `@supabase/supabase-js`
- NEW `src/game/services/supabase.ts` — client init
- NEW `src/game/services/LeaderboardService.ts` — fetch/submit
- EDIT `src/game/systems/SaveSystem.ts` — player name generation
- EDIT `src/game/systems/BankingSystem.ts` — submit score on extraction
- EDIT `src/game/scenes/MenuScene.ts` — leaderboard display
- EDIT `src/game/types.ts` — LeaderboardEntry type
- EDIT `src/game/constants.ts` — player name save key

## Scope boundaries
- No all-time leaderboard
- No name editing/choosing UI — auto-generated only
- No anti-cheat beyond Supabase RLS (casual game)
- No leaderboard on GameOver screen (menu only)

## Open questions
- None — user confirmed all design decisions
