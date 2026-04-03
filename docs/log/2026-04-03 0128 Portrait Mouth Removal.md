# 2026-04-03 0128 Portrait Mouth Removal

## TL;DR
- What changed: Removed explicit mouth marks from Slick, Regent, and all liaison portraits
- Why: The user wanted the portraits to stop showing mouths
- What didn't work: The first build failed because `RegentComm.ts` still imported `strokeArc` after its mouth geometry was removed
- Next: Eyeball the portraits on actual phone-sized layouts to make sure the no-mouth faces still read cleanly

---

## Full notes

This was another follow-up inside the existing comm portrait rendering plan, not a new direction change.

I removed the lower-face mouth cues from the active portrait factories in `SlickComm`, `RegentComm`, and `LiaisonComm`. That included Slick's lip arcs/lines, Regent's lower-face grille, and the liaison lower-face marks that still read as mouths. I also removed the same mouth-style marks from the legacy Slick helper so the file's old fallback portrait does not contradict the new art direction.

The first build caught one leftover `strokeArc` import in `RegentComm.ts` after the mouth geometry came out. Removing that fixed the compile. `npm.cmd run build` now passes, so the repo remains runnable.
