# 2026-04-06 2313 Mission Select Palette Settings

## TL;DR
- What changed: Added a `PALETTE` control to the MissionSelect settings panel, matching the main menu and in-run pause settings.
- Why: Palette swapping was available elsewhere but missing from the pre-run briefing flow, which made settings feel inconsistent.
- What didn't work: MissionSelect still has its own duplicated settings UI implementation rather than a shared settings panel component.
- Next: Keep an eye on whether the palette-restart preservation should also carry additional transient MissionSelect state in the future.

---

## Full notes

- Added a palette row and button to `MissionSelectScene` settings using the same `getNextPaletteId` / `PALETTE_LABELS` pattern as the menu.
- Added a MissionSelect-specific restart handoff so changing palette from that panel preserves current selected favors, current run mode, reroll visit count, and reopens the settings panel after restart.
- Verified with `npm.cmd run build`.
