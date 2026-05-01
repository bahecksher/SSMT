# 2026-05-01 0102 Boss Core Device Targets

## TL;DR
- What changed: Added a small rotating device inside each exposed boss core.
- Why: The exposed core needed a tangible object to shield-ram, not just a hollow ring/area marker.
- What didn't work: No live boss visual pass was run in this session; only build verification.
- Next: Use `Shift+0` to expose both boss cores and confirm the device reads as the thing to hit.

---

## Full notes

- Added `drawCoreDevice()` to `GunshipBoss`.
- Added `drawCoreDevice()` to `SlagHauler`.
- The device is a rotating gate-colored diamond with a bright center point inside the existing core ring.
- Collision/breach mechanics are unchanged; this is a visual target clarity pass.
- Build verification passed with `npm.cmd run build`.
