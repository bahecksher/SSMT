# 2026-03-28 1340 Hold-to-Discard and Mission Tuning

## TL;DR
- What changed: Added hold-to-discard mechanic (800ms hold with red fill animation), increased mission difficulty targets, 2-3x reward values, limited discards to 3 (replenished +1 per extraction)
- Why: User wanted harder missions with bigger payoffs and a more deliberate discard action
- What didn't work: Nothing — build passes cleanly
- Next: Playtest all changes on desktop and mobile

---

## Full notes

### Hold-to-discard mechanic
- MissionSelectScene rewritten with hold-to-interact pattern
- pointerdown starts a timer; update() loop advances it and draws red fill overlay
- Red fill grows left-to-right using fillRoundedRect with progress-based width
- If held >= 800ms (DISCARD_HOLD_MS), mission is replaced with a new random one
- If released before threshold, treated as tap (toggle accept)
- pointerout cancels hold and clears fill
- Global pointerup also cancels any active hold

### Discard limits
- MAX_DISCARDS = 3, stored in MissionSaveData.discardsRemaining
- Counter displayed below mission cards ("DISCARDS: N/3")
- "HOLD TO DISCARD" hint hidden when 0 discards remain
- Replenished by 1 per successful extraction (capped at MAX_DISCARDS) in claimAndClear()

### Mission difficulty increase
- All targets raised (e.g., REACH_CREDITS T1: 300→500, DESTROY_ENEMIES T1: 1→2)
- All rewards 2-3x previous values (e.g., REACH_CREDITS T1: 100→250, SURVIVE_EXTRACT T3: 1200→3000)

### Files changed
- `src/game/scenes/MissionSelectScene.ts` — complete rewrite with hold-to-discard
- `src/game/data/missionCatalog.ts` — harder targets, higher rewards
- `src/game/systems/MissionSystem.ts` — MAX_DISCARDS, discard replenishment
- `src/game/types.ts` — discardsRemaining field on MissionSaveData
