# Plan - Campaign Mission Select Upgrades
_Created: 2026-04-29 1254_

## Goal
Implement the requested campaign Mission Select purchases, arcade free-reroll rule, and phase-10+ beam return without disturbing the current versus work more than necessary.

## Approach
1. Add a small campaign-only action strip on Mission Select for extra lives and next-run phase selection while preserving the existing reroll/deploy flow.
2. Extend save/runtime handoff plumbing so bought lives persist in the campaign session and the selected paid phase start applies when launching the next run.
3. Update late-game hazard flow so cross-arena beams keep spawning during phase 10+ boss runs.
4. Build-verify the patch and then rewrite session docs to reflect the new active focus.

## Scope boundaries
- No broad Mission Select redesign beyond what is needed to fit the new controls.
- No deeper campaign economy rebalance beyond the prices in the request.
- No follow-up pass on restored company buffs unless a change here directly touches that logic.

## Open questions
- Treat phase selection as a temporary next-run purchase rather than a permanent campaign unlock.
- Clamp paid phase selection to phase 10, since phase 10 is the highest distinct phase breakpoint currently surfaced in gameplay.
