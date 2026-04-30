# 2026-04-29 2250 Versus Spectate NPCs And Extract Window

## TL;DR
- What changed: added NPC ships and the active extraction gate/window to the versus mirror snapshot and spectate ghost renderer.
- Why: the death/spectate screen was missing opponent-visible NPCs and the extract window, so the peer arena did not match what the surviving player saw.
- What didn't work: no live two-window visual pass was run in this session.
- Next: verify in a real two-client match that NPCs, shield/salvage indicators, and the extraction window remain readable over the globe/ring backdrop.

---

## Full notes

- Extended `MirrorSnapshot` with `npcs` and `gate` payloads.
- `GameScene.sendSnapshot()` now includes active NPC position, heading, shield state, salvaging state, and the current active extraction gate/window when present.
- The spectate mirror now draws NPCs as headed ghost triangles with optional shield and salvaging rings.
- The spectate mirror now draws extraction preview rings and active extraction timer rings from the peer snapshot.
- `npm.cmd run build` passes.
