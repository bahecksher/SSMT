# Plan revision - Mirrored Versus Multiplayer Phase 4 decisions

_Created: 2026-04-29 1009_
_Revises: docs/plans/2026-04-28 2304 Plan - Mirrored Versus Multiplayer.md (Phase 4 only)_

## Why this revision

Original plan named the events and a one-line "match ends when both terminal OR (one extract + one death)" rule, but left three loose ends. Settled here before code:

1. Timeout when only one peer has gone terminal.
2. Tiebreaker on equal score.
3. Rematch flow.

## Decisions

### 1. Lone-terminal timeout

When local terminal fires, peer state is one of: also-terminal, alive (no terminal yet), or stalled (no recent snapshot). Resolution:

- **Both terminal:** resolve immediately. Standard side-by-side compare.
- **Local death + peer alive:** resolve immediately as **LOSE**. Peer outlived us; even if they later die, they ranked higher because they survived past our death. No wait.
- **Local extract + peer alive:** wait up to **15s** for peer terminal.
  - Peer terminal (extract or death) arrives → reevaluate with both outcomes.
  - Timeout → declare **WIN by extract**. Peer rendered as `STILL ALIVE — TIMED OUT`, score = last snapshot score.

The 15s figure is deliberately longer than the >10s heartbeat-stall forfeit in Phase 1; we want peer to have a fair chance to finish a phase + reach extract gate after we've extracted. A peer who has actually disconnected will fail the heartbeat check independently, and we don't need to special-case it here.

### 2. Tiebreaker on equal score

- **Extract beats death.** If one extracted and one died with the same score, the extractor wins.
- **Same outcome (both extract or both die) + equal score → TIE.** No earlier-`t` tiebreak. Equal score is rare enough that a clean TIE is fine and avoids exposing snapshot clock skew to the user.

### 3. Rematch

**Out for MVP.** Result screen offers MENU only. Reasoning:

- Rematch needs lobby reentry with the same room code, peer-side ready handshake, and re-broadcast of `match_start`. Non-trivial vs. value.
- Peer can re-create or rejoin via room code from menu in a few taps.
- MENU on both sides is clean: each peer leaves the channel via `cleanup()` on scene change, no lingering subscriptions.

Defer to Phase 6 polish if requested.

## Match-end state machine (local view)

```
                       ┌─────────────────────┐
local terminal fires → │ broadcast event     │
                       │ store local outcome │
                       │ enter RESULTS       │
                       │ hide mirror PIP     │
                       └──────────┬──────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
    peer already        local death,           local extract,
    has outcome         peer no outcome        peer no outcome
            │                     │                     │
            ▼                     ▼                     ▼
    show side-by-side   show side-by-side      show "waiting" panel
    immediately         immediately (LOSE)     start 15s timeout
                                                        │
                                          ┌─────────────┴─────────────┐
                                          ▼                           ▼
                                  peer outcome arrives        timeout fires
                                          │                           │
                                          ▼                           ▼
                                  swap to side-by-side        swap to side-by-side
                                  (cancel timer)              (peer = STILL ALIVE)
```

## Wire format

`NET_EVENT.MATCH_EXTRACT` payload:
```ts
{ score: number, time: number, rep?: number }
```

`NET_EVENT.MATCH_DEATH` payload:
```ts
{ score: number, time: number, cause: 'asteroid' | 'enemy' | 'laser' }
```

`time` = ms since match start (sender clock, same as `MirrorSnapshot.t`).
`rep` reserved for future rep-flux signal — not displayed yet.

## Banner rule

| Local | Peer            | Score compare        | Banner |
| ----- | --------------- | -------------------- | ------ |
| ext   | ext             | local > peer         | WIN    |
| ext   | ext             | local = peer         | TIE    |
| ext   | ext             | local < peer         | LOSE   |
| ext   | death           | (any)                | WIN    |
| ext   | survived/timeout| (any)                | WIN    |
| death | ext             | (any)                | LOSE   |
| death | death           | local > peer         | WIN    |
| death | death           | local = peer         | TIE    |
| death | death           | local < peer         | LOSE   |
| death | alive           | (immediate, no wait) | LOSE   |

## Result UI shape

- Reuse panel + button styling from `showResultUi`.
- Banner bar at top: WIN (green/COLORS.GATE) / LOSE (red/COLORS.HAZARD) / TIE (yellow/COLORS.HUD).
- Two columns, separated by vertical divider:
  - Column header: `YOU` / `P2`.
  - Score (large).
  - Outcome line: `EXTRACTED` (gate color) / `DESTROYED — <cause>` (hazard color) / `STILL ALIVE` (hud color, peer-only synthetic).
  - Phase reached (small).
- MENU button at bottom. No retry, no leaderboard write (already blocked by `RunMode.VERSUS`).

## Out of scope (Phase 4)

PvP attacks, shared seed, bullet mirroring, rematch, versus leaderboard, reconnect, stacked-layout mirror, `rep` payload rendering, anti-cheat.
