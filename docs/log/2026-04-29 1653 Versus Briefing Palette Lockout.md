# 2026-04-29 1653 Versus Briefing Palette Lockout

## TL;DR
- What changed: Removed the palette row from the versus MissionSelect settings panel and tightened the panel layout so the multiplayer briefing no longer exposes palette switching.
- Why: Palette changes still restarted MissionSelect, which was a multiplayer handoff risk during lock-in.
- What didn't work: I did not run a live two-window browser check in this pass; this is build-verified only.
- Next: Run the full versus briefing flow manually and confirm settings still feel clean without the palette row.

---

## Full notes

- Chose the smallest safe fix instead of trying to make live palette swaps multiplayer-safe mid-briefing.
- Campaign and other non-versus flows still keep palette switching in the shared settings UI.
- `npm.cmd run build` passes after the MissionSelect settings layout change.
