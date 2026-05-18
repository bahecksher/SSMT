# 2026-05-18 1252 Rival Damage Feedback

## TL;DR
- What changed: Redline now throws ship-debris effects on damage and shows persistent hull damage as HP drops.
- Why: Rival damage should be visible, satisfying, and consistent with existing NPC/enemy destruction language.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether the smoke/wing loss is readable at gameplay speed.

---

## Full notes

Added per-hit feedback:
- Shield damage to Redline now spawns `ShipDebris` fragments, using the same visual effect family as NPC/enemy destruction.
- Destroying Redline spawns a larger debris burst.
- Damage hits play a smaller pitched ship-break cue.

Added persistent rival damage:
- At damaged HP, Redline shows hull cracks.
- At 1 HP, one wing is visibly missing and smoke vents from the broken side.
- The existing HP pips remain as a readable backup.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
