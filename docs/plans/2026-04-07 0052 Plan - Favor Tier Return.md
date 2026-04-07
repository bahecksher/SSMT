# Plan - Favor Tier Return
_Created: 2026-04-07 0052_

## Goal
Bring back standing-based favor tiers with cheaper three-step pricing and consistent percentage formatting.

## Approach
- Reconnect favor offers in `companyData.ts` to company standing instead of a fixed tier.
- Price tiers at `1000c`, `2000c`, and `3000c` for `KNOWN`, `TRUSTED`, and `ELITE`.
- Normalize favor boost strings to percentage copy in one shared formatter.
- Update MissionSelect favor cards so locked companies stay readable and non-interactive.
- Verify the change set with `npm.cmd run build`.

## Scope boundaries
- No new wallet or leaderboard systems
- No rebalance of the underlying boost strengths
- No separate saved purchase tier for carried campaign favors

## Open questions
- Whether campaign favor persistence should eventually remember the exact purchased tier instead of following current standing
