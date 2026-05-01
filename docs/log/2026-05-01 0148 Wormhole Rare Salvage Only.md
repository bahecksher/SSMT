# 2026-05-01 0148 Wormhole Rare Salvage Only

## TL;DR
- What changed: Wormhole space now spawns only rare salvage.
- Why: The pocket should feel like a rare-loot side space, not a mix of normal salvage and rare rewards.
- What didn't work: No live wormhole pass was run in this session; only build verification.
- Next: Enter wormhole space and confirm no normal salvage appears or respawns.

---

## Full notes

- Suppressed normal salvage respawn scheduling while `pocketActive` is true.
- Suppressed the normal "ensure at least one debris exists" respawn safety net while in pocket mode.
- Seeded one rare salvage immediately on wormhole pocket entry.
- Existing timed pocket rare salvage spawns remain active.
- Build verification passed with `npm.cmd run build`.
