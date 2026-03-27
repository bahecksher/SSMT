# 2026-03-27 1555 Exclusive Comms and Line Refresh

## TL;DR
- What changed: Refreshed the remaining Slick lines that still sounded like a training sim and made Slick/Regent comm playback mutually exclusive.
- Why: The current line table still had a few stale phrases, and phase/event routing could let both comm systems talk over the same moment.
- What didn't work: The first exclusivity pass left an unused helper behind, which TypeScript caught during build.
- Next: Playtest whether the current priority feels right when a Slick beat and a Regent beat happen close together.

---

## Full notes

- Slick `menuIntro` now says `Two rules in this yard: stay alive and get paid.`
- Slick `extraction` now says `Money's banked. That's how you work the interface.`
- Slick `death` now refers to losing a drone instead of learning in a sim.
- Phase-change comms now choose a single winning speaker for that event instead of rolling both sides independently.
- All gameplay comm show paths in `GameScene` now route through exclusive helpers that hide the other panel first.
- Verified with `npm.cmd run build`.
