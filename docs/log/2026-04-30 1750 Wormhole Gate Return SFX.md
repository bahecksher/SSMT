# 2026-04-30 1750 Wormhole Gate Return SFX

## TL;DR
- What changed: added a shared gate-travel SFX helper and used it for both normal extraction and wormhole gate return.
- Why: returning from a wormhole through a gate should sound like taking a gate, not like collecting a pickup.
- What didn't work: no live audio check yet.
- Next: compare normal extraction and wormhole return in browser and tune volume if needed.

---

## Full notes

1. Files created/changed
   - `src/game/scenes/GameScene.ts`
   - `docs/state.md`
   - `docs/log/2026-04-30 1750 Wormhole Gate Return SFX.md`
2. What works
   - Added `playGateTravelSfx()` in `GameScene`.
   - Normal extraction calls the shared gate-travel helper.
   - Wormhole gate exit calls the same helper instead of `pickup`.
   - `npm.cmd run build` passes.
3. What is still stubbed
   - No dedicated gate SFX asset; the helper currently uses the existing `bomb` SFX at reduced volume.
4. Risks or follow-up recommendations
   - The reused `bomb` SFX may be too heavy or too familiar; consider adding a dedicated gate/warp sound later.
