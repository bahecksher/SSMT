# 2026-04-06 1557 Globe Regent Red Alignment Pass

## TL;DR
- What changed: moved Tortuga's globe wireframe and Regent comm styling onto the same red threat thread as the NPCs
- Why: the user wanted the planet and Regent comm lines to share the exact NPC red instead of sitting on adjacent orange/hazard colors
- What didn't work: nothing major; the key choice was targeting the globe renderer and Regent comm panel directly rather than changing the broader hazard color token
- Next: playtest the blue palette and confirm the red globe/Regent thread feels cohesive without overpowering the ring or beam accents

---

## Full notes

Updated `GeoSphere` so the planet wireframe now uses `COLORS.NPC` instead of the separate globe color token. This keeps Tortuga on the same active threat-thread color as NPC ships without affecting other `COLORS.GLOBE` uses like the title pilot display.

Updated `RegentComm` so the header text, body text, panel border, and portrait's main red linework all use `COLORS.NPC`, while the brighter `COLORS.BEAM` accents remain in place for contrast. This keeps Regent visually tied to the same hostile faction read as the NPC crowd.
