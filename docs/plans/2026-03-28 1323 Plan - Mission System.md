# Plan: Mission System

## Context
The game currently has a tight arcade loop (menu -> play -> extract/die -> repeat) but no meta-progression beyond the leaderboard. The mission system adds optional per-run objectives that players choose before deploying, creating a risk/reward layer: accept harder missions for bonus credits on extraction, or skip them entirely.

## Architecture Overview

**New scene**: `MissionSelectScene` inserted between Menu and Game. Flow becomes:
```
Menu -> MissionSelectScene -> GameScene (retry loops back to GameScene directly)
```

**New files** (4):
- `src/game/scenes/MissionSelectScene.ts` -- card-based mission picker UI
- `src/game/systems/MissionSystem.ts` -- progress tracking, completion, persistence
- `src/game/data/missionCatalog.ts` -- mission definitions, generation, labels

**Modified files** (8):
- `src/game/types.ts` -- mission types and interfaces
- `src/game/constants.ts` -- new scene key, localStorage key
- `src/game/config.ts` -- register MissionSelectScene
- `src/game/scenes/MenuScene.ts` -- redirect tap-to-start to MissionSelectScene
- `src/game/scenes/GameScene.ts` -- wire MissionSystem tracking, rewards on extraction, HUD, results display
- `src/game/systems/SalvageSystem.ts` -- expose per-frame mining vs salvage income
- `src/game/systems/ScoreSystem.ts` -- add `addBanked()` for mission reward injection
- `src/game/ui/Hud.ts` -- mission progress indicators

## Mission Types & Values

| Type | Tier 1 (50%) | Tier 2 (35%) | Tier 3 (15%) | Reward |
|------|-------------|-------------|-------------|--------|
| REACH_CREDITS | 300 | 800 | 2000 | 50 / 150 / 400 |
| EXTRACT_CREDITS | 200 | 500 | 1500 | 75 / 200 / 500 |
| DESTROY_NPCS | 2 | 5 | 10 | 40 / 120 / 300 |
| DESTROY_ENEMIES | 1 | 3 | 6 | 60 / 180 / 450 |
| MINING_CREDITS | 100 | 300 | 800 | 50 / 150 / 400 |
| SALVAGE_CREDITS | 150 | 400 | 1000 | 50 / 150 / 400 |
| SURVIVE_EXTRACT | 3 phases | 5 phases | 8 phases | 80 / 250 / 600 |
| NO_DAMAGE_PHASE | 1 phase | 2 phases | 3 phases | 60 / 180 / 450 |
| COLLECT_SHIELDS | 2 | 4 | 6 | 30 / 100 / 250 |

## Persistence Model

- Key: `ssmt_missions` in localStorage
- Stores: array of up to 3 `ActiveMission` objects + lifetime completion count
- Mission cards persist across sessions; progress resets each run (consistent with unbanked credits being lost on death)
- On extraction: completed missions are claimed (reward added to score), then removed. Empty slots filled on next MissionSelectScene visit
- On death: progress reset, cards preserved
- On discard: card replaced with new random mission, saved immediately

## MissionSelectScene UI

3 mission "cards" stacked vertically. Each card is a rounded rect panel with:
- Mission description (e.g., "DESTROY 3 ENEMIES")
- Reward amount (e.g., "REWARD: +180")
- ACCEPT / DISCARD buttons

Bottom: DEPLOY button (always available, even with 0 missions accepted). Accepted cards get a green border + checkmark. Discard replaces the card with a new random mission via brief swap animation.

Background: static starfield (simpler than MenuScene's full simulation since player won't linger here).

Entity handoff: MenuScene snapshots drifter/debris/npc state -> passes to MissionSelectScene -> forwards unchanged to GameScene.

## GameScene Integration Points

1. **Credit tracking**: After `salvageSystem.update()`, call `missionSystem.trackCredits(scoreSystem.getUnbanked())`
2. **NPC kill**: At player-shield-ram NPC code (~line 600), call `missionSystem.trackNpcKill()`
3. **Enemy kill**: At shield-absorb enemy (~line 655) and bomb board-wipe enemy clear, call `missionSystem.trackEnemyKill()`
4. **Mining/Salvage income**: SalvageSystem exposes `lastFrameSalvageIncome` and `lastFrameMiningIncome`. GameScene reads these and calls `missionSystem.trackMiningIncome()` / `trackSalvageIncome()`
5. **Phase tracking**: On phase change, call `missionSystem.trackPhaseReached(phase)`
6. **Shield collection**: When shield is picked up, call `missionSystem.trackShieldCollected()`
7. **Extraction**: After `bankScore()`, call `missionSystem.checkExtraction()`, then `scoreSystem.addBanked(missionSystem.getReward())`
8. **No-damage phase**: Track whether player took damage this phase, on phase advance call `missionSystem.trackCleanPhase()` if no damage taken

## HUD Display

Bottom-left, below arena. Up to 3 compact lines (10px monospace):
```
REACH 500cr    320/500
KILL 3 ENEMIES   1/3
MINE 300cr     300/300 DONE
```
Completed missions turn GATE green. In-progress missions use HUD cyan at 60% alpha.

**Completion pop**: Center-screen floating text "MISSION COMPLETE +150" in GATE color, same pattern as SalvageSystem's `spawnRewardText`.

## Results Screen Enhancement

On extraction, after score line, show:
```
MISSIONS:
+ REACH 500cr       +150
+ KILL 3 ENEMIES    +180
BONUS: +330
```

On death, show:
```
MISSIONS: INCOMPLETE
REACH 500cr   320/500
```

## Retry Flow

GameScene retry (tap to retry) goes directly to GameScene with `retryFromDeath: true`. Missions are loaded from localStorage persistence, progress reset. Player doesn't revisit MissionSelectScene on retry -- same mission cards carry over.

## Implementation Order

1. Types + constants + tuning values
2. Mission catalog (definitions + generation)
3. MissionSystem core (tracking + persistence)
4. SalvageSystem income exposure
5. ScoreSystem `addBanked()` method
6. MissionSelectScene (UI + scene registration + config)
7. MenuScene redirect
8. GameScene integration (tracking hooks + rewards)
9. Hud mission display
10. Results screen mission section
11. Retry flow verification

## Verification

1. `npm.cmd run build` -- no type errors
2. Menu -> tap start -> see MissionSelectScene with 3 cards
3. Accept/discard missions, deploy
4. During gameplay: HUD shows mission progress updating
5. Complete a mission mid-run: see completion pop-up
6. Extract: results show mission rewards added to score, leaderboard submission includes bonus
7. Die: progress lost, same mission cards on retry
8. Close browser, reopen: missions persisted
9. Discard on MissionSelectScene: new random mission appears
10. Mobile: cards fit on narrow screen, tap targets work
