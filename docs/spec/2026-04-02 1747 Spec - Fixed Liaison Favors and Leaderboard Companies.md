# Spec - Fixed Liaison Favors and Leaderboard Companies
_Created: 2026-04-02 1747_

## Goal
Simplify favor buying on `MissionSelect` and reuse reputation as company affiliation for leaderboard pilots instead of favor unlock/scaling.

## Favor cards
- Each company liaison always offers one fixed favor.
- Favor strength and price do not scale with reputation.
- Favor cards should show:
  - company name
  - liaison name
  - favor name/value
  - purchase state/cost copy
- Favor cards should not show standing, raw rep, next threshold, or rep progress bars.

## Reputation and leaderboard identity
- Mission completion still awards company rep.
- A player's leaderboard company is the company with their highest saved rep total.
- If all saved company reps are `0`, the leaderboard entry may omit company affiliation.
- Leaderboard rows should render company identity compactly with a short tag and company-colored text when a company is present.

## Server contract
- The `scores` table needs a nullable `company_id` text column.
- Client submissions will send one of these exact values when known:
  - `DEEPCORE`
  - `RECLAIM`
  - `IRONVEIL`
  - `FREEPORT`
- Existing rows can remain `NULL`.
- Client fetches should read `company_id` when available and still tolerate older rows without it.

## Out of scope
- Reworking mission rep rewards
- Rebalancing favor prices beyond using the current fixed offer level
- Reworking liaison comm behavior during runs
- Backfilling old leaderboard rows with company affiliation
