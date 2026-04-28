# 2026-04-27 2257 MissionSelect Rep Subline Removal

## TL;DR
- What changed: Removed the extra lower text from each corporation row on MissionSelect, including the bonus copy and right-side `WORKING WITH` / `EARN REP` hints.
- Why: The user wanted those NPC-like extra lines gone because they felt unnecessary.
- What didn't work: No browser playtest yet, so this is build-verified only.
- Next: Open MissionSelect and confirm the cleaner rows still make affiliation state readable enough during actual use.

---

## Full notes

- Kept the core row structure intact: company name, standing, rep value, progress bar, and tap-to-affiliate behavior all still work.
- Removed the lower bonus/status text layer only, so this stays a small UI cleanup instead of a broader rep-panel redesign.
- Dropped now-unused `getCompanyBoostDisplay` and `getRepLevel` imports from `MissionSelectScene.ts`.
- `npm.cmd run build` passes after the cleanup.
