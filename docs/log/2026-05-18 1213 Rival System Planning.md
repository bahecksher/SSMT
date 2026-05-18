# 2026-05-18 1213 Rival System Planning

## TL;DR
- What changed: Created a rival-system plan covering roster, behavior, company ties, story hooks, implementation phases, and open questions.
- Why: The next story overhaul needs named antagonists and ability-driven arena pressure before implementation starts.
- What didn't work: No code was implemented or verified in this planning pass.
- Next: Decide Quick Play vs Campaign spawn rules, persistence/rematch scope, and whether Ironveil heat is tied to reputation or contract choice.

---

## Full notes

Read `docs/state.md`, the active ship-hardening plan/revision, the latest campaign Mission Select spec, recent company/NPC/boss/Versus decisions, and relevant source locations for companies, NPCs, boss force fields, Versus laser/repulsor mechanics, and comm UI.

The active plan was ship-hardening, but this session intentionally paused implementation to capture a new feature plan requested by the user. No ship-hardening checklist items were changed.

Created `docs/plans/2026-05-18 1213 Plan - Rival System.md`.

Key direction:
- Rivals are elite named NPC encounters, not boss replacements.
- One active rival at a time.
- Most early rivals should be Ironveil because the faction identity already supports enforcement and intimidation.
- Rival abilities should be asymmetric and unavailable to the player.
- Rivals should flee instead of dying when reduced to 1 HP or when a lethal hit would land.
- First prototype should likely be the laser rival because existing laser/beam behavior gives a clean foundation.

Suggested first roster:
- Veyra Kade / Ironveil / laser duelist.
- Brann Ochoa / Ironveil / repulse bully.
- Mira Sable / Ironveil / layered shield bruiser.
- Dr. Pell Arcturus / Reclaim / black-hole bomb scientist.

No build or tests were run because no runtime code changed.
