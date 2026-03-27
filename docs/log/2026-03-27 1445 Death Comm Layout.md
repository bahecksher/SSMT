# 2026-03-27 1445 Death Comm Layout

## TL;DR
- What changed: Slick and Regent death comm panels now move into the center of the death result screen and stay visible until the player resets.
- Why: User wanted death-screen comms centered and persistent instead of timing out at the top.
- What didn't work: Nothing blocked; build passed after adding layout controls to both comm components.
- Next: Playtest centered placement on mobile to make sure it doesn't crowd the result card.

---

## Full notes

- Added simple pinned-layout/reset-layout controls to both comm UI classes so they can be repositioned without duplicating the panel implementation.
- Changed death handling to keep only the active speaker visible and disable auto-hide by passing `0` for death-only comms.
- Updated the death result card layout to reserve center space for the comm panel and push best/retry/menu lower when needed.
- Extraction results still use the normal layout and gameplay comm position.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
