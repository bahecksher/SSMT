# 2026-03-28 2238 Company Reputation System

## TL;DR
- What changed: Built full 5-phase company reputation system with 4 factions, per-run boosts, liaison NPCs, and visual branding
- Why: User wants deeper progression — reputation unlocks per-run benefits and NPC contacts
- What didn't work: Swipe mission selection failed across 4 iterations; replaced with REROLL ALL button earlier in session
- Next: Playtest rep flow end-to-end, tune thresholds/boosts/weights

---

## Full notes

### Phase 1: Data foundation
- Added `CompanyId`, `CompanyRepSave`, `RunBoosts` to types.ts
- Created `companyData.ts` with 4 company definitions (DEEPCORE/RECLAIM/IRONVEIL/FREEPORT), rep thresholds (0/3/8/16), boost multipliers, and localStorage persistence
- Created `missionData.ts` with hand-editable mission templates (9 types, weighted selection favoring salvage/mining)
- Updated `missionCatalog.ts` to import from missionData and pass company through to MissionDef
- Added `COMPANY_REP_KEY` to constants.ts

### Phase 2: Rep tracking
- Updated `MissionSystem.claimAndClear()` to award rep per completed mission tier (1/2/4) and persist via `saveCompanyRep()`
- Renamed discards → rerolls throughout MissionSystem and MissionSelectScene
- Added REROLL ALL button to MissionSelectScene (generates 3 fresh missions, limited to 3 rerolls)

### Phase 3: Boost injection
- Added `setBoosts()` to SalvageSystem (salvageYieldMult, miningYieldMult) and DifficultySystem (npcBonusMult, bonusDropChanceAdd)
- Applied multipliers at 4 income calculation points
- Wired GameScene to read `runBoosts` from handoff and call `setBoosts()` on both systems
- MissionSelectScene `deploy()` computes RunBoosts from rep and passes in handoff

### Phase 4: Visual polish
- Mission cards show 4px company color bar on left edge
- Company name tag ("DEEPCORE MINING CONTRACT") below reward text
- Card height increased from 100 to 110 to fit
- Rep bar on MissionSelectScene shows companies with rep >= 1 (color pip, name, level label, boost value)

### Phase 5: Liaison comm
- Created `liaisonLines.ts` with intro/runStart/boost dialogue per company per rep level (1-3)
- Created `LiaisonComm.ts` — parameterized comm panel with company colors, unique portrait shapes (diamond/rounded rect/shield/circle), and dark tinted background
- Integrated into GameScene: highest-rep company's liaison shows during countdown (1.8s after Slick's opener), followed by boost announcement

### New files (6)
- `src/game/data/companyData.ts`
- `src/game/data/missionData.ts`
- `src/game/data/liaisonLines.ts`
- `src/game/ui/LiaisonComm.ts`
- `src/game/scenes/MissionSelectScene.ts` (heavily modified)
- `src/game/systems/MissionSystem.ts` (modified)

### Modified files (5)
- `src/game/types.ts` — CompanyId, CompanyRepSave, RunBoosts, MissionDef.company
- `src/game/constants.ts` — COMPANY_REP_KEY
- `src/game/data/missionCatalog.ts` — imports missionData, passes company
- `src/game/systems/SalvageSystem.ts` — setBoosts + multipliers
- `src/game/systems/DifficultySystem.ts` — setBoosts + multipliers
- `src/game/scenes/GameScene.ts` — RunBoosts handoff, liaison comm creation + scheduling
