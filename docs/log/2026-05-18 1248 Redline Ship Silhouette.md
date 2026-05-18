# 2026-05-18 1248 Redline Ship Silhouette

## TL;DR
- What changed: Reworked Redline's visual silhouette to read more like a distinct fighter ship.
- Why: The larger rival hull was reading too much like a blob.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Check Redline in motion with `Shift+R` and adjust proportions if the badge or barrel crowd the hull.

---

## Full notes

Visual changes:
- Replaced the broad pentagon body with a longer-nosed swept-wing fighter silhouette.
- Added a notched tail, center spine, wing struts, cockpit, and clearer nose-mounted laser barrel.
- Reduced the passive glow ring opacity and moved the hover badge farther above the ship so it separates from the hull.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
