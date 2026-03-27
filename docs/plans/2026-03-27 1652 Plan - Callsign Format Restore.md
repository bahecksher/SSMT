# Plan - Callsign Format Restore
_Created: 2026-03-27 1652_

## Goal
Restore player callsigns to the longer arcade-style `AAA-###` format without discarding existing saved identities.

## Approach
- Update player-name generation and storage normalization to emit `AAA-###`.
- Migrate previously saved callsigns by preserving the available letters and last three digits, padding a missing third letter when needed.
- Update the menu callsign editor to prompt for three letters again.
- Verify the change with a production build.

## Scope boundaries
- No leaderboard schema changes.
- No new callsign-editing UI beyond the existing prompt flow.
- No changes to score submission behavior.

## Open questions
- Whether the padded third letter for previously saved two-letter callsigns should remain random or use a more opinionated migration rule later.
