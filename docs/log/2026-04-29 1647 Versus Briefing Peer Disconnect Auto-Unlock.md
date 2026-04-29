# 2026-04-29 1647 Versus Briefing Peer Disconnect Auto-Unlock

## TL;DR
- What changed: versus MissionSelect now listens to session presence during briefing, and if the peer disconnects the local side auto-unlocks and shows the peer as `LEFT`.
- Why: the locked player could get stranded in briefing after a peer drop because the scene only listened for briefing-ready and deploy broadcasts.
- What didn't work: no live two-window disconnect pass yet; this is build-verified only.
- Next: manually drop one side during briefing and confirm the remaining side unlocks cleanly and can back out or wait.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

Root cause:

- `MissionSelectScene` only registered briefing listeners for:
  - `MATCH_BRIEFING_READY`
  - `MATCH_DEPLOY`
- If the peer disconnected during briefing, no broadcast arrived to clear local state.
- A locally locked player stayed locked with the UI still implying the peer was briefing/locked.

Implemented in `src/game/scenes/MissionSelectScene.ts`:

- Added versus-briefing presence tracking fields:
  - `versusPeerPresent`
  - `versusPeerName`
- `setupVersusBriefingListeners()` now also registers `session.onPresence(...)`.
- Presence handler behavior:
  - updates cached peer presence/name
  - if peer disappears:
    - clears `versusPeerLocked`
    - clears `versusLocalLocked`
    - redraws the deploy button/status pill
- Deploy status UI now shows:
  - `<PEER> // LOCKED`
  - `<PEER> // BRIEFING…`
  - `<PEER> // LEFT`

Important behavior choice:

- Auto-unlock is local-only. We do not try to broadcast an unlock when the peer is already gone.
- This keeps the fix small and avoids pretending we can repair a dead session from the disconnected side.

Files changed:

- `src/game/scenes/MissionSelectScene.ts`
- `docs/state.md`
- `docs/log/2026-04-29 1647 Versus Briefing Peer Disconnect Auto-Unlock.md`

Verification:

- `npm.cmd run build`
