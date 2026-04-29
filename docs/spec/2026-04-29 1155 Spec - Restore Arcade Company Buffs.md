# Spec - Restore Arcade Company Buffs
_Created: 2026-04-29 1155_

## Goal
Restore the static company affiliation buff package to arcade runs so we can playtest whether the added mining, salvage, score, and bonus-drop pressure feels too strong in practice.

## Core change
- `ARCADE` deploys should once again pass and apply the selected affiliation's static `RunBoosts`.
- `CAMPAIGN` deploys should continue to use the same static company perk package.
- `VERSUS` should stay neutral and should not receive company static boosts.

## Player-facing behavior
- Mission Select should show the normal company perk summary in both arcade and campaign.
- Choosing a company in arcade should once again affect the run's static perk package.
- This is a test-oriented restore; balance judgment happens after manual play.

## Out of scope
- Rebalancing the company perk values themselves
- Removing company affiliation selection from arcade
- Reworking company reputation gain or leaderboard affiliation rules
- Any versus-specific gameplay changes beyond keeping it neutral
