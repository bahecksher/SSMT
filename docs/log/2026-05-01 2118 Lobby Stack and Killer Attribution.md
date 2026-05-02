# 2026-05-01 2118 Lobby Stack and Killer Attribution

## TL;DR
- What changed: Versus lobby roster now stacks pilots vertically instead of running horizontally on one line. Multiplayer death attribution now records and displays *who* killed each pilot (asteroid, Regent beam, Regent enemy, boss beam, or `<PILOT> LASER` / `<PILOT> ENEMY` for peer sabotage).
- Why: User asked for stacked roster + visibility into death cause in multiplayer.
- What didn't work: n/a.
- Next: smoke-test multi-window deaths to confirm names attribute correctly across clients.

---

## Full notes

### Lobby roster stacking
`MenuScene.formatVersusRoster` previously joined entries with `'  '` producing a single horizontal line. Switched to `'\n'` so each pilot occupies its own row. To prevent the multi-line text from colliding with the hint/buttons rendered below, both WAITING and COUNTDOWN cases now measure the rendered peer text height, subtract the single-line font size, and shift the hint row + button row down by the extra height.

### Multiplayer death attribution
- Added optional `versusSenderId` to `EnemyShip` and a `senderId` to `VersusLaserStrike`. Both fields are populated when a peer's `MATCH_LASER` / `MATCH_ENEMY` broadcast spawns the entity locally.
- Added `MatchDeathPayload.killer?: string` for the over-the-wire pretty descriptor.
- Added `VersusOutcome.killer?: string` so all UI paths can render the descriptor.
- `GameScene.handleDeath` now takes an optional `killerLabel` and forwards it to `broadcastLocalTerminal`.
- `deriveKillerLabel(cause, source)` produces the descriptor:
  - drifter → `ASTEROID`
  - boss beam → `BOSS BEAM`
  - hazard beam → `REGENT BEAM`
  - laser strike → `<PILOT> LASER` (or `PLAYER LASER` if sender unknown)
  - enemy with versusSenderId → `<PILOT> ENEMY`
  - enemy without versusSenderId → `REGENT ENEMY`
- Hit sites (`update` versus laser strike loop and the main collision branch) now derive the killer label and pass it through.
- Receiver-side `MATCH_DEATH` handler reads `p.killer` and stashes it in both `peerOutcomeMap` and `peerOutcome`.
- `getVersusPilotRows` now appends `— <KILLER>` to `DESTROYED` rows when present.
- 1v1 result UI `outcomeLabel` prefers the killer string over the bare cause word.

## Verify
1. `npm.cmd run build` — passes.
2. Open 3-4 browser sessions in a Versus room. Roster should render stacked with one pilot per line.
3. Have one pilot fire a sabotage laser that kills another pilot. Final standings should show `DESTROYED — <KILLER NAME> LASER` for the victim on every client.
4. Have a pilot die to a Regent enemy and another to a peer-spawned ENEMY. Standings should distinguish `DESTROYED — REGENT ENEMY` from `DESTROYED — <KILLER NAME> ENEMY`.
5. Have a pilot die to an asteroid and another to the boss beam during a late phase. Expect `ASTEROID` and `BOSS BEAM` respectively.
