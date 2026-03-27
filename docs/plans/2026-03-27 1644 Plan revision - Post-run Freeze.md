# Plan revision - Post-run Freeze
_Created: 2026-03-27 1644_
_Revises: docs/plans/2026-03-27 1638 Plan revision - Pause Feature.md_

## What changed
- After death or extraction, the run should no longer keep advancing phases, gates, spawns, or reactive lines.
- The background should still feel alive behind result screens.

## Why
- The user noticed phase progression and comm triggers continuing after the run had already ended, which makes the results state feel incorrect.

## Updated approach
Add a frozen post-run simulation mode:
- stop progression systems after death/extraction/results
- keep existing entities moving visually in the background
- keep phase count, gate progress, and related comm triggers frozen at the moment the run ends
- do not reuse the crawl-pause behavior for result screens in this pass
