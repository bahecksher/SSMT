# Spec - Arcade Only Access
_Created: 2026-04-14 0045_

## Goal
Remove unfinished campaign mode from the accessible player flow so the shipped game presents a single stable arcade path.

## Core change
- Remove the campaign button from the main menu.
- Stop exposing campaign as a selectable run mode in the normal UI flow.
- Normalize stale saved mode state back to `ARCADE`.
- Prevent old or manual scene handoffs from reopening campaign through Mission Select or Game startup.

## Player-facing behavior
- The menu should no longer show a campaign toggle.
- The menu should clearly present the game as arcade-only for now.
- Starting from the menu should always enter the arcade mission-selection flow.
- Existing arcade leaderboard, corporation leaderboard, and affiliation UI remain unchanged.

## Persistence behavior
- Saved `selectedMode` values should resolve to `ARCADE`.
- Existing campaign wallet/session data does not need to be deleted in this pass.
- The change should avoid destructive migration of old campaign progress unless explicitly requested later.

## Out of scope
- Deleting all dormant campaign code paths and save fields
- Reworking arcade wallet or leaderboard behavior
- Replacing campaign with a different second mode in the same session
