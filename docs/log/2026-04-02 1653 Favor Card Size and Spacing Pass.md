# 2026-04-02 1653 Favor Card Size and Spacing Pass

## TL;DR
- What changed: Increased MissionSelect favor-card height and redistributed the internal text blocks so selected/armed cards have more breathing room
- Why: The favor cards felt cramped once the larger text, portraits, badges, and selected-state details were all visible together
- What didn't work: This session verified with a production build only, not a live viewport/device visual pass
- Next: Playcheck selected/armed favor cards on short phones and desktop, then trim only if any state still feels crowded

---

## Full notes

- Increased the target/max favor-card height and reduced some stack/deploy spacing so the four-card favor section can claim a bit more vertical room.
- Raised the dense-layout threshold slightly so truly cramped cards still fall back to the tighter variant.
- Reworked the content anchors inside each favor card so the standing, offer, and detail lines use the taller card instead of bunching near the header.
- Kept the portrait-led left alignment from the previous pass and preserved right-side room for the status badge.
- `npm.cmd run build` passes.
- This was a focused MissionSelect layout pass; the active layered-music plan remains unchanged.
