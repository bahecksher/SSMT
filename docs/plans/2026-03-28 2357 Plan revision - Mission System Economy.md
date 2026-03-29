# Plan revision - Mission System Economy
_Created: 2026-03-28 2357_
_Revises: docs/plans/2026-03-28 1323 Plan - Mission System.md_

## What changed
- Company reputation no longer auto-applies passive run boosts on MissionSelect.
- Successful extraction now pays into a persistent wallet at 35% of extracted credits while Slick keeps 65%.
- MissionSelect adds a favor-buying section where unlocked company boosts can be selected and committed before deploy.
- Death retry preserves the purchased favor loadout for that retry; extraction retry starts fresh with no carried favor spend.

## Why
- The player should choose when to spend company advantages instead of receiving them invisibly.
- Extracted credits needed a persistent economy that does not dilute leaderboard scoring.
- Slick's cut makes the wallet feel like part of the fiction rather than a neutral menu counter.

## Updated approach
- Persist `walletCredits` in the main save data alongside best score.
- Award wallet payout on extraction, then show both the wallet gain and Slick's cut on the results screen.
- Treat rep as unlock level only: each company exposes one favor offer whose tier and cost scale with rep.
- Spend wallet credits on deploy, pass only purchased favors into `GameScene`, and leave runs fully playable with zero favors selected.
