# 2026-04-02 1639 Favor Card Liaison Portraits

## TL;DR
- What changed: Increased the company/liaison prominence in MissionSelect favor cards and added a small portrait preview for each liaison
- Why: The favor section needed clearer company identity and a visual read on who each liaison is
- What didn't work: This session verified with a production build only, not a live viewport/device visual pass
- Next: Playcheck favor-card density and portrait spacing on short phones and desktop, then trim any crowded states if needed

---

## Full notes

- Exported the shared liaison portrait factory from `LiaisonComm` so MissionSelect can reuse the same portrait language instead of inventing a second version.
- Split the old combined favor-card title into a larger company-name line plus a dedicated liaison line.
- Added a small portrait column with a framed liaison preview on each favor card and reserved text width so the larger labels do not run into the portrait.
- Kept the existing standing/offer/detail content, but let it flow beneath the larger company/liaison header instead of relying on the old single-line title.
- `npm.cmd run build` passes.
- This was a targeted MissionSelect polish pass; the active layered-music plan remains unchanged.
