# 2026-03-28 1323 Mission System Implementation

## TL;DR
- What changed: Added complete mission system — pre-game briefing scene, 9 mission types, in-game tracking, HUD display, results integration, persistence
- Why: User requested meta-progression beyond leaderboard; optional per-run objectives with credit rewards
- What didn't work: Nothing — clean implementation following the planned architecture
- Next: Playtest all mission types, tune difficulty values, test on mobile

---

## Full notes

### New files created
- `src/game/scenes/MissionSelectScene.ts` — Card-based mission picker UI between Menu and Game
- `src/game/systems/MissionSystem.ts` — Progress tracking, completion detection, persistence (localStorage)
- `src/game/data/missionCatalog.ts` — 9 mission type definitions across 3 tiers, random generation

### Modified files
- `src/game/types.ts` — Added MissionType, MissionDef, ActiveMission, MissionSaveData interfaces
- `src/game/constants.ts` — Added MISSION_SELECT scene key, MISSIONS_KEY localStorage key
- `src/game/config.ts` — Registered MissionSelectScene in Phaser scene array
- `src/game/scenes/MenuScene.ts` — Redirected tap-to-start from GameScene to MissionSelectScene
- `src/game/scenes/GameScene.ts` — Wired all tracking hooks, mission rewards on extraction, results display
- `src/game/systems/SalvageSystem.ts` — Exposed per-frame mining/salvage income getters
- `src/game/systems/ScoreSystem.ts` — Added addBanked() for mission reward injection
- `src/game/systems/BankingSystem.ts` — Separated extraction detection from score save/submit (for mission bonus timing)
- `src/game/ui/Hud.ts` — Added updateMissions() for compact bottom-left progress display

### Mission types and values
| Type | Tier 1 | Tier 2 | Tier 3 | Reward |
|------|--------|--------|--------|--------|
| REACH_CREDITS | 300 | 800 | 2000 | 50/150/400 |
| EXTRACT_CREDITS | 200 | 500 | 1500 | 75/200/500 |
| DESTROY_NPCS | 2 | 5 | 10 | 40/120/300 |
| DESTROY_ENEMIES | 1 | 3 | 6 | 60/180/450 |
| MINING_CREDITS | 100 | 300 | 800 | 50/150/400 |
| SALVAGE_CREDITS | 150 | 400 | 1000 | 50/150/400 |
| SURVIVE_EXTRACT | 3ph | 5ph | 8ph | 80/250/600 |
| NO_DAMAGE_PHASE | 1ph | 2ph | 3ph | 60/180/450 |
| COLLECT_SHIELDS | 2 | 4 | 6 | 30/100/250 |

### Key design decisions
- MissionSelectScene is a separate scene (not overlay) for clean separation
- Entity handoff passes through MissionSelectScene unchanged
- Mission progress resets each run (consistent with unbanked credits lost on death)
- Mission cards persist across sessions in localStorage
- Completed missions removed on extraction; empty slots filled on next briefing visit
- Retry flow skips MissionSelectScene, loads persisted missions
- BankingSystem refactored to separate detection from finalization (mission bonus must be added before leaderboard submit)
