# Plan - Manual Corporation Selector
_Created: 2026-04-14 0054_

## Goal
Add a lightweight corporation selector to the main menu so players can explicitly choose their active affiliation.

## Approach
- Introduce a persisted company-affiliation selection alongside the existing rep save data.
- Keep highest-rep affiliation as a fallback only when no manual selection exists yet.
- Replace the menu's read-only affiliation text with a styled selector button that cycles through `FREE AGENT` and the four corporations.
- Reuse the shared affiliation helper so leaderboard tagging, corporation board footer text, and arena/UI coloring all follow the same chosen affiliation.
- Verify the project still builds successfully.

## Scope boundaries
- No full dropdown, modal, or dedicated enlistment scene
- No refactor of company rep systems beyond affiliation selection
- No changes to the Supabase contract beyond continuing to send `company_id` when available

## Open questions
- Whether the cycling selector is enough long-term or should become a richer picker later
- Whether the manual selector should eventually also appear in Mission Select
