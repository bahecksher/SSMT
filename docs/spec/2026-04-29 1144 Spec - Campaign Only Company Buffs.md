# Spec - Campaign Only Company Buffs
_Created: 2026-04-29 1144_

## Goal
Keep company affiliation and selection in the game, but stop granting the static affiliation buff package during arcade runs. Static company perks should only apply in campaign mode.

## Core change
- `CAMPAIGN` deploys continue to pass and apply the selected affiliation's static `RunBoosts`.
- `ARCADE` deploys should use neutral boosts even if the player has a selected company affiliation.
- Arcade-facing Mission Select copy should make it clear the displayed company perk is campaign-only.

## Affiliation behavior
- Company affiliation selection still persists locally.
- Affiliation still drives company-colored presentation and leaderboard/company tagging behavior.
- This change only removes the static gameplay perk package from arcade. It does not remove affiliation itself.

## Player-facing behavior
- In `ARCADE`, the player can still choose a company affiliation, but they should not receive the mining/salvage/score/drop-rate static boost package in gameplay.
- In `CAMPAIGN`, the selected company's static perk still applies as before.
- Mission Select should avoid implying that arcade deploy will receive the displayed perk immediately.

## Out of scope
- Removing company affiliation selection from arcade
- Rebalancing the company perk values themselves
- Reworking company reputation gain or leaderboard affiliation rules
- Any versus-specific changes
