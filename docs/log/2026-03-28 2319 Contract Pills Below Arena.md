# 2026-03-28 2319 Contract Pills Below Arena

## TL;DR
- What changed: active contract pills now anchor in the lower gutter below the arena instead of from the screen bottom
- Why: they were sitting directly on the arena border and felt cramped
- What didn't work: the old fixed bottom margin ignored the runtime arena boundary and could land the pills on the border line
- Next: check the lower-gutter placement on narrow mobile screens with 1-3 active contracts

---

## Full notes

- Updated `Hud.updateMissions()` to compute the bottom gutter height from `layout.arenaBottom` and place the pill row inside that gutter with a small minimum gap.
- Kept the pill styling, sizing, and spacing unchanged so the change stays narrowly focused on vertical placement.
- Verified with `npm.cmd run build`.
