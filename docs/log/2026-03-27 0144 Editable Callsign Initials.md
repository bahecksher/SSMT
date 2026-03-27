# 2026-03-27 0144 Editable Callsign Initials

## TL;DR
- What changed: Players can now pick the 3-letter prefix of their callsign from the menu instead of always being randomly assigned one.
- Why: The user wanted players to choose the letters they go by while keeping the arcade-style callsign format.
- What didn't work: I kept the 4-digit suffix automatic and persistent; only the letters are editable in this pass.
- Next: Playtest whether a custom in-game editor would feel better than the current prompt-based edit flow.

---

## Full notes

- `SaveSystem` now supports updating the 3-letter initials while preserving the existing 4-digit suffix.
- `MenuScene` makes the `PILOT:` line interactive and opens a simple prompt to collect the three-letter prefix.
- Initial input is normalized to uppercase letters only and must resolve to exactly three letters before saving.
- Verification: `npm.cmd run build`
