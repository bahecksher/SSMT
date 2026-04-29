# 2026-04-29 1656 Spectator Laser Regen to 7s

## TL;DR
- What changed: Increased spectator sabotage laser charge regen from 5 seconds to 7 seconds.
- Why: The versus beam/disruption cadence was feeling too fast and needed a little more breathing room.
- What didn't work: I did not run a live two-window browser pass in this tweak; this is build-verified only.
- Next: Manually check whether 7 seconds lands in the right middle ground between passive and spammy.

---

## Full notes

- Treated "versus beams respawn rate" as the spectator laser charge regen timer in `SPECTATE_LASER_REGEN_MS`.
- Left the separate pickup send cooldown and warning/lethal timing untouched.
- `npm.cmd run build` passes after the tuning change.
