# Spec - Manual Corporation Selector
_Created: 2026-04-14 0054_

## Goal
Let players explicitly choose which corporation they are flying for from the main menu instead of inferring affiliation only from highest reputation.

## Core change
- Replace the read-only `WORKING WITH` corporation text in the menu with an interactive corporation selector.
- The selector should let the player choose between `FREE AGENT`, `DEEPCORE`, `RECLAIM`, `IRONVEIL`, and `FREEPORT`.
- The chosen affiliation should persist locally.
- Chosen affiliation should drive leaderboard `company_id` tagging and corporation-colored presentation in the menu and gameplay.

## Affiliation behavior
- If the player has explicitly chosen a corporation, that selection is the active affiliation.
- If the player has explicitly chosen `FREE AGENT`, there is no active corporation affiliation.
- If the player has never made a manual choice, highest saved company rep remains the fallback affiliation.

## UI behavior
- The menu should clearly present the current corporation selection as a button in the `WORKING WITH` slot.
- The button should use the chosen corporation color when applicable.
- Corporation leaderboard footer copy should distinguish between manual selection and highest-rep fallback where useful.

## Out of scope
- A full corporation-enlistment screen or modal
- Reworking company reputation rewards
- Changing how company favors are unlocked or purchased
- Server-side schema changes beyond the existing `company_id` expectation
