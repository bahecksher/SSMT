# 2026-03-27 0141 No-Freeze Death Wipe

## TL;DR
- What changed: The arena now keeps updating during the death wipe itself, and the player ship turns red on fatal impact.
- Why: The user wanted the game to stop freezing at all on death and to get a clearer immediate hit read from the player icon.
- What didn't work: I did not add any extra explosion effect yet; this is a pacing/clarity pass.
- Next: Playtest whether the red-hit feedback plus no-freeze wipe is enough, or whether a quick ship flicker/explosion should be layered on top.

---

## Full notes

- `GameScene` now continues updating world systems in `DEAD` and `EXTRACTING` while still keeping gameplay consequences disabled outside `PLAYING`.
- `Player` gained a `destroyed` visual mode so fatal hits can immediately tint the ship red using the existing hologram rendering path.
- Death no longer hides the ship at the start of the wipe; the red ship remains visible underneath the transition and result overlay.
- Verification: `npm.cmd run build`
