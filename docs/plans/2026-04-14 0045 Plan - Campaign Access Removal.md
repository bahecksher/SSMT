# Plan - Campaign Access Removal
_Created: 2026-04-14 0045_

## Goal
Make the currently shipped experience arcade-only by removing campaign access from the player-facing flow.

## Approach
- Remove the campaign toggle from the menu and simplify the mode status copy to an arcade-only message.
- Normalize saved mode selection back to arcade so old localStorage state does not revive campaign.
- Force Menu, MissionSelect, and Game scene handoffs to use arcade mode even when stale campaign values are present.
- Verify the project still builds successfully.

## Scope boundaries
- Do not delete campaign save data structures in this pass
- Do not refactor all dormant campaign-specific result or wallet code
- Do not change the corporation leaderboard or affiliation systems beyond keeping them working in arcade

## Open questions
- Whether campaign should later return in a more complete form or be removed from the codebase entirely
