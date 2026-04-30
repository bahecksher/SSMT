# Plan - Corporation Board Layout Polish
_Created: 2026-04-29 2145_

## Goal
Improve the arcade corporation leaderboard so the donut chart has clearer breathing room above the corporation rows and the corporation rows read as a uniform list.

## Approach
- Keep the existing donut graph and full four-corp roster.
- Increase the vertical gap between the graph bottom and the first corporation row.
- Replace the single centered corporation row string with fixed rank / name / score columns so every row aligns consistently.
- Build-verify the menu after the layout change.

## Scope boundaries
- No changes to corporation scoring logic or leaderboard data fetches.
- No changes to pilot leaderboard formatting.
- No changes to corporation graph rendering itself beyond its relationship to the row list.

## Open questions
- Whether the new spacing still feels correct on the smallest phone viewport will need a quick live visual pass.
