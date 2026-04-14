# Plan revision - Manual Corporation Selector
_Created: 2026-04-14 0056_
_Revises: docs/plans/2026-04-14 0054 Plan - Manual Corporation Selector.md_

## What changed
- Restricted the selector's corporation options to companies where the player has earned rep
- Kept `FREE AGENT` available as the neutral selection
- Added fallback handling so stale saved corporation selections that are no longer valid do not stay active

## Why
- The user wanted corporation choice to reflect earned standing rather than exposing every corporation immediately
- Gating choices by rep keeps the selector aligned with progression while still giving the player explicit control

## Updated approach
- Derive the selectable corporation list from positive saved rep values
- Let explicit selection override rep-based fallback only when the selected corporation is actually unlocked
- Show neutral copy such as `EARN REP TO UNLOCK` when no corporations are currently selectable
