# Spec - MissionSelect Standing and Slick Deal
_Created: 2026-03-29 0053_

## Goal
Make MissionSelect denser and more informative while turning Slick's flat tax into a progression deal the player can improve over time.

## MissionSelect changes
- Contract cards should be as trim as practical while still showing tier, contract label, company, and reward clearly.
- Favor cards should show the company name, liaison name/role, current rep standing, next standing threshold, current offer, and cost or shortfall.
- The favor header should show wallet totals plus the player's current Slick deal and the next deal threshold.

## Company standing
- Every company's current standing is visible directly on its favor card.
- Standing uses both a label (`UNKNOWN`, `KNOWN`, `TRUSTED`, `ELITE`) and the raw rep total.
- A small progress bar shows how close that company is to its next standing tier.
- Liaison detail stays lightweight on this screen: name plus role.

## Slick deal progression
- Save data tracks cumulative `careerBankedCredits` separately from spendable wallet credits.
- Slick's cut improves as career banked credits rise:
  - below `5000c`: player `35%`, Slick `65%`
  - `5000c+`: player `40%`, Slick `60%`
  - `15000c+`: player `45%`, Slick `55%`
  - `30000c+`: player `50%`, Slick `50%`
- Extraction results show the actual wallet share and Slick cut used for that run.
- Spending wallet credits on favors does not worsen the deal, because progression keys off career banked credits instead of current wallet balance.

## Persistence
- Existing saves migrate missing `careerBankedCredits` to `0`.
- Reputation persistence and favor unlock thresholds remain unchanged.

## Out of scope
- Negotiating custom company-specific payout deals
- Slick dialogue changes tied to the new payout tiers
- New company detail screens beyond the MissionSelect briefing view
