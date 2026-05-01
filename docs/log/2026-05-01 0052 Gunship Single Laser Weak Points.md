# 2026-05-01 0052 Gunship Single Laser Weak Points

## TL;DR
- What changed: Removed mirrored gunship laser weak points so each live laser has one visible and collidable port.
- Why: Back-to-back mirrored ports could cause shield-ramming one weak point to carry the player directly into the opposite weak point.
- What didn't work: The mirrored-port idea created a collision trap during aggressive hardpoint rams.
- Next: Test the Regent gunship with `Shift+0` and confirm hardpoint rams feel deliberate instead of punishing.

---

## Full notes

- Updated `GunshipBoss.getCollidingHardpointIndex()` to check only the current beam side for each alive gun.
- Updated `GunshipBoss.draw()` so alive guns render one port on the current beam side instead of ports on both sides.
- Destroyed hardpoints also leave one ghost ring on the same side instead of paired mirrored remnants.
- Beam behavior still uses the existing side-selection logic; the difference is that only the live beam-side port is exposed as the weak point.
- Build verification passed with `npm.cmd run build`.
