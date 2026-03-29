# 2026-03-28 2154 Death Results Comm Spacing

## TL;DR
- What changed: death results layout now measures the mission section and pins Slick/Regent comm panels beneath it; retry/menu prompts were nudged lower to preserve spacing
- Why: the new mission breakdown on the death screen was being covered by the comm panel wipe-in
- What didn't work: fixed-percentage comm placement no longer held once the results stack gained extra mission lines
- Next: playtest the results panel on phone-sized screens with 0-3 active missions

---

## Full notes

- Updated `GameScene.showResultUi()` to track the bottom of the score/mission content and clamp death comm placement between the mission block and the retry prompt.
- Kept the change intentionally narrow: no comm component refactor, no extraction flow changes, and no mission copy changes.
- Verified with `npm.cmd run build`.
