# 2026-03-27 1438 Callsign Format

## TL;DR
- What changed: Callsigns now use 2 editable letters plus a persistent random 3-digit suffix, and old saved callsigns migrate automatically.
- Why: User wanted a shorter pilot identity format.
- What didn't work: Nothing blocked; build passed after updating generation, editing, and migration behavior.
- Next: Playtest how the shorter callsigns read in the menu and leaderboard.

---

## Full notes

- Updated `SaveSystem` so new player names generate as `AA999` instead of the previous longer format.
- Changed callsign editing in the menu to prompt for 2 letters and reject anything shorter/longer after normalization.
- Added migration in `getPlayerName()` so older saved names are converted to the new format by preserving the first two letters and last three digits when possible.
- Left leaderboard storage/submission untouched beyond the new player name shape, so existing score flow still works.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
