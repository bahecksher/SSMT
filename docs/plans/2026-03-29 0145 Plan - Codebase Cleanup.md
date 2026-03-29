# Plan - Codebase Cleanup
_Created: 2026-03-29 0145_

## Goal
Clean up stale code paths left behind by recent iteration without changing the current mission, wallet, or gameplay behavior.

## Approach
- Audit for exported helpers, constants, and scenes that no longer participate in the live game flow.
- Remove dead runtime pieces and unused data structures that add confusion during future edits.
- Route MissionSelect mission persistence through the shared mission helpers instead of duplicating raw localStorage writes.
- Re-run the production build after cleanup and update session docs with what changed and what still needs playtesting.

## Scope boundaries
- No gameplay rebalance or UI redesign.
- No large scene refactors beyond the shared persistence cleanup.
- No new tools or lint infrastructure in this pass.

## Open questions
- Whether any currently unused dialogue helpers were intentionally being kept for a future MissionSelect chatter pass.
