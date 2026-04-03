# 2026-04-03 0113 Comm Portrait Rendering Pass

## TL;DR
- What changed: Replaced the flat outline portraits for Slick, Regent, and all four company liaisons with layered holo portrait renders and added shared portrait drawing primitives
- Why: The user wanted the portraits to feel less like vector icons, more like Tron-style renders, and wanted Slick to read more feminine
- What didn't work: The first broad patch against `SlickComm.ts` fought the file's existing text/encoding quirks, so the portrait rewrite had to be applied in smaller hunks
- Next: Eyeball the new portraits on actual phone-sized screens and trim any details that feel too busy at the smallest MissionSelect scale

---

## Full notes

This session intentionally diverged from the previously active layered-music plan because the user requested a portrait-art pass instead. I recorded that direction change here and moved the active plan pointer in `state.md` to the new portrait-rendering plan rather than silently drifting.

I added a small shared portrait primitive module for polygon fills/strokes, arc accents, and holo backdrops, then rebuilt the portrait factories in `SlickComm`, `RegentComm`, and `LiaisonComm` around that language. Slick now has a softer face plate, swept silhouette, and a more feminine read. Regent now leans into a harsher armored visor and helmet. The liaisons now each have their own company-shaped holo portrait treatment instead of all sharing the same minimal face pattern.

`npm.cmd run build` passed after the portrait pass, so the repo is left in a runnable state. The remaining risk is visual rather than technical: the new details should be checked on a real phone-sized viewport to make sure the smallest favor-card portraits still read cleanly.
