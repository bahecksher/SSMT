# 2026-04-03 0125 Slick Humanoid Portrait Pass

## TL;DR
- What changed: Reworked Slick's shared portrait factory so she reads more like a humanoid face with feminine features instead of a visor-heavy helmet silhouette
- Why: The previous pass landed well overall, but the user wanted Slick pushed further toward a human feminine appearance
- What didn't work: Replacing the earlier Slick portrait block in place was fragile because of the current file's existing text quirks, so I left the old version as a legacy helper and appended the new live factory below it
- Next: Eyeball the new Slick portrait on an actual phone-sized viewport to make sure the added facial detail still reads quickly

---

## Full notes

This was a follow-up within the existing comm portrait rendering plan rather than a plan change. The broader cast pass remains intact; only Slick was adjusted here.

I updated `createSlickPortrait` in `src/game/ui/SlickComm.ts` to use a more human face structure: softer shoulders and neck, hair behind and in front of the face, gentler jaw/cheek shaping, brows, eye arcs, nose hints, and a lip line. The holo style remains the same, but the silhouette now reads more like a person and less like a mask.

The earlier portrait version is still kept in the file as a legacy exported helper purely because that was the safest way to land the patch without risking the surrounding comm code. The active call sites now use the new `createSlickPortrait` export. `npm.cmd run build` passed after the update, so the repo remains runnable.
