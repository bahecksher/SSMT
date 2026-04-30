# 2026-04-30 1818 Gunship Alternating Side Lasers

## TL;DR
- What changed: gunship hardpoints now have mirrored ports and alternate laser warning/fire cycles between the two sides of the hull. Both bosses also got a small additional speed bump.
- Why: center-crossing gunship movement needed laser pressure on both sides, and both bosses still felt slightly too slow across the stage.
- What didn't work: no live browser feel pass was completed here; this is build-verified tuning.
- Next: use `Shift+0` to test the gunship laser alternation and shield-ram windows from both sides.

---

## Full notes

Updated `src/game/entities/GunshipBoss.ts`:

- Added mirrored gun-port positions for each hardpoint.
- Hardpoint collision now accepts shield rams against either side's port.
- Beam cycles now alternate the active side per hardpoint by cycle index.
- Beam collision and drawing use the active side for that hardpoint's current warning/fire cycle.
- Destroyed hardpoints render as disabled ports on both sides.

Updated `src/game/data/tuning.ts`:

- `GUNSHIP_BOSS_BODY_SPEED`: `74 -> 84`
- `SLAG_HAULER_BODY_SPEED`: `58 -> 66`

Verification:

- `npm.cmd run build` passes.

Risks / follow-up:

- Alternating side fire should be checked live for readability, especially when the gunship crosses diagonally.
- The extra speed bump is intentionally modest, but the exposed-core shield breach window may need another small adjustment after playtesting.
