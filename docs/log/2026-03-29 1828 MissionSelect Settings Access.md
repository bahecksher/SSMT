# 2026-03-29 1828 MissionSelect Settings Access

## TL;DR
- What changed: Added a settings button and modal to MissionSelect with the same shake, scanline, and music toggles already available elsewhere.
- Why: Players should be able to adjust settings from the mission briefing screen without backing out to the main menu.
- What didn't work: Nothing major; this was a contained UI pass.
- Next: Feel-check the MissionSelect top bar spacing and confirm the modal is comfortable on shorter phone screens.

---

## Full notes

MissionSelect now has a top-right `SETTINGS` button that opens a modal panel.

The panel includes:
- `SHAKE` on/off
- `SCAN` on/off
- `MUSIC` on/off with the existing `*BETA*` tag

Implementation details:
- Added a MissionSelect-local settings modal instead of forcing navigation back to Menu
- Added `HologramOverlay` to MissionSelect so the scanline toggle has immediate visible effect there too
- Wired music toggle through the shared music system so it updates live from the briefing screen
- Used a full-screen blocker while the modal is open so taps outside close it instead of selecting missions behind it

Validation:
- `npm.cmd run build` passed after the changes
