# 2026-04-02 1636 Comm Panel Overflow Fix

## TL;DR
- What changed: Converted Slick, Regent, and liaison comm windows from fixed-height panels to content-sized panels and updated result-screen comm spacing to respect the live panel height
- Why: Longer wrapped dialogue was spilling outside the comm displays after the readability font-size bump
- What didn't work: This session verified with a production build only, not a live device/browser visual pass
- Next: Playcheck the comm windows in normal gameplay and result states on phone and desktop, then tune any remaining spacing issues

---

## Full notes

- Added per-panel layout recalculation in `SlickComm`, `RegentComm`, and `LiaisonComm` so each window grows to fit its current wrapped message.
- Increased internal text spacing and portrait centering so taller comm windows still look balanced rather than just padded.
- Updated result-screen comm placement in `GameScene` to use the real active comm height, which keeps pinned dialogue from crowding the retry/menu buttons.
- `npm.cmd run build` passes.
- This was a targeted follow-up to the earlier readability pass; the active layered-music plan remains unchanged.
