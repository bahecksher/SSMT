# 2026-04-29 1155 Restore Arcade Company Buffs

## TL;DR
- What changed: Restored static company affiliation buffs to arcade, kept them active in campaign, and kept versus neutral.
- Why: User wants arcade perk behavior back for a live balance check before deciding whether the mode gets too crazy.
- What didn't work: Nothing blocked the rollback; this was a small targeted revert of the earlier campaign-only gating.
- Next: Manually test arcade and campaign to confirm perk application and judge whether arcade pacing needs retuning.

---

## Full notes

- Updated `src/game/scenes/MissionSelectScene.ts` so company rows show the normal perk summary again and deploy always hands off the current affiliation `runBoosts`.
- Updated `src/game/scenes/GameScene.ts` so handed-off company boosts apply in non-versus runs again, while `VERSUS` still nulls them out.
- Wrote a new spec file, `docs/spec/2026-04-29 1155 Spec - Restore Arcade Company Buffs.md`, to supersede the short-lived campaign-only buff direction.
- Rewrote `docs/state.md` to reflect that arcade buffs are back and now need manual balance testing.
- Ran `npm.cmd run build` successfully after the change.
