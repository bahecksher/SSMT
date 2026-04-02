# 2026-04-02 1649 Portrait Alignment Pass

## TL;DR
- What changed: Moved MissionSelect favor portraits to the left of the company text and added a framed Slick portrait above the main menu title
- Why: The favor portraits read better as leading identity markers, and the main menu benefits from giving Slick the same visual presence
- What didn't work: This session verified with a production build only, not a live viewport/device visual pass
- Next: Playcheck the menu header and favor-card layouts on short phones and desktop, then trim only if anything feels crowded

---

## Full notes

- Reworked the MissionSelect favor-card layout so the liaison portrait is the leading left-side visual and the company/liaison lines flow to its right.
- Reserved text width against the right-side status badge instead of against a right-side portrait column.
- Exported the shared Slick portrait factory from `SlickComm` so the main menu can reuse the same portrait language as the comm windows.
- Added a framed Slick portrait above the menu title stack and shifted the title block down to sit under it cleanly.
- `npm.cmd run build` passes.
- This was a targeted UI layout pass; the active layered-music plan remains unchanged.
