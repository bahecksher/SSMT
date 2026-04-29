# 2026-04-29 1508 Versus MissionSelect Briefing Routing

## TL;DR
- What changed: Phase E of the new versus plan. Versus runs no longer go straight from lobby to GameScene — they now route through `MissionSelectScene` with `RunMode.VERSUS`. Each side picks its own contracts, favors, and (optional) company affiliation, taps `LOCK IN`, and the host fires `MATCH_DEPLOY` once both peers are locked. Real wallet spend, asymmetric loadouts allowed.
- Why: Plan called for missions/favors/affiliation in versus, with each side picking own. Locks the previously-decided behavior in code.
- What didn't work: N/A — TypeScript build is green. Needs a real two-window playtest of the briefing-ready handshake.
- Next: Manual two-window playtest of A–E end-to-end. After that: balance tuning on sabotage laser drop rate, possible rematch-routes-through-briefing follow-up.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

### NetSystem changes

`src/game/systems/NetSystem.ts`:

- New events on `NET_EVENT`:
  - `MATCH_BRIEFING_READY` — sent by either peer when they toggle `LOCK IN`.
  - `MATCH_DEPLOY` — host-only broadcast when both peers are locked.
- New payload types: `MatchBriefingReadyPayload { ready: boolean }`, `MatchDeployPayload { matchId: string; delayMs: number }`.

### VersusLobbyScene changes

`src/game/scenes/VersusLobbyScene.ts`:

- After both peers are READY and the lobby countdown finishes, `fireMatchStart` now `scene.start`s `MISSION_SELECT` (not `GAME`) with `mode: RunMode.VERSUS` and the existing `multiplayer` handoff. The lobby's role is now to pair the peers; mission/favor selection happens in MissionSelect; deploy happens after both lock in.

### MissionSelectScene changes

`src/game/scenes/MissionSelectScene.ts`:

- `HandoffData` carries an optional `multiplayer: MultiplayerHandoff`.
- New scene state: `multiplayer`, `versusLocalLocked`, `versusPeerLocked`, `versusDeployFired`, `versusHandingOff`.
- `setupVersusBriefingListeners` registers handlers for `MATCH_BRIEFING_READY` (mirror peer's lock state into `versusPeerLocked`) and `MATCH_DEPLOY` (guest path: follow host into GameScene).
- `drawDeployButton` now branches on versus:
  - Label is `LOCK IN` → `UNLOCK` toggle (instead of `DEPLOY`).
  - Pulsing alpha freezes when locked-in so the button reads as committed.
  - Adds a peer status line below the button: `<PEER> // BRIEFING…` or `<PEER> // LOCKED` (gate-color when locked).
  - Tap routes to `toggleVersusLockIn` instead of `deploy`.
- `toggleVersusLockIn` flips local state, broadcasts `MATCH_BRIEFING_READY { ready }`, redraws, and calls `maybeFireVersusDeploy`.
- `maybeFireVersusDeploy` host-only: when `versusLocalLocked && versusPeerLocked && !versusDeployFired`, generate a fresh `matchId`, broadcast `MATCH_DEPLOY`, and call `fireVersusDeploy` locally.
- `fireVersusDeploy` saves missions, builds run boosts from saved company rep, calls `session.clearListeners()` to drop MissionSelect's broadcast bindings, and `scene.start`s GameScene with the versus handoff plus this side's selected missions and run boosts.
- Cleanup path: if leaving MissionSelect without firing a versus deploy (e.g., MENU back), tear down the multiplayer session so the peer sees the drop.
- Asymmetric loadouts allowed: each peer reads its own saved company rep / affiliation / mission cards. No override sync.

### Build verification

`npm.cmd run build` is green. No new modules added (Phase E is wiring-only).

### Out of scope this session

- Rematch still goes GameScene → GameScene directly, skipping MissionSelect. Existing behavior preserved; a future "rematch through briefing" would need a new flow.
- Briefing-side spectate of peer's mission picks (we deliberately don't sync choices).
- Auto-unlock when peer disconnects mid-briefing — locked player can hit MENU but state doesn't auto-clear.
- Sabotage laser feel tuning (`VERSUS_LASER_WARNING_MS` was already bumped 900 → 1500 after the user's first feel pass).

### Risks / follow-up

- Palette change inside MissionSelect calls `scene.restart`, which runs `cleanup` and tears down the session. A versus player who toggles palette mid-briefing will drop the match. Could be fixed by including `multiplayer` in `buildMissionSelectRestartHandoff` and skipping `session.leave()` when restarting the same scene.
- Peer-disconnect during briefing leaves the locked player waiting indefinitely; presence-driven auto-unlock would be a small ergonomic win.
- Wallet spend on rerolls / favors / paid start-phase still goes through the real wallet — confirmed per user decision. If a peer drops after you spend, no refund (matches existing arcade abandon behavior).
- Both peers fire `clearListeners` on the same session at slightly different times during deploy. The empty arrays are safe to overwrite (GameScene re-binds via `onBroadcast`), but the host's `MATCH_DEPLOY` broadcast must complete before the guest's `clearListeners` runs — Supabase's broadcast is fire-and-forget so this should always succeed in practice; worst case the guest's `MATCH_DEPLOY` listener no-ops because the listener array was emptied before delivery, and the guest sits stuck on MissionSelect. Watch for this in playtest.
