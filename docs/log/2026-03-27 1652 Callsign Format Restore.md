# 2026-03-27 1652 Callsign Format Restore

## TL;DR
- What changed: Restored player callsigns to the `AAA-###` format, updated menu editing back to 3 letters, and added migration for previously saved names.
- Why: The user wanted the longer arcade-style callsign format back with a hyphenated presentation.
- What didn't work: Nothing blocking; previously saved 2-letter callsigns need a padded third letter, so migration assigns one automatically the first time they are read.
- Next: Playtest menu editing and leaderboard readability with the restored format.

---

## Full notes

This session diverged from `docs/plans/2026-03-27 1644 Plan revision - Post-run Freeze.md` because the user requested a callsign-format change.

Created `docs/plans/2026-03-27 1652 Plan - Callsign Format Restore.md`.

Implementation:
- `SaveSystem` now generates `AAA-###` callsigns for new players.
- Existing saved callsigns are normalized into the new format by keeping available letters and the last three digits.
- Previously saved 2-letter callsigns keep their chosen letters and receive a one-time random third letter during migration.
- The menu callsign prompt and helper copy now expect three editable letters again.

Verification:
- `npm.cmd run build`
