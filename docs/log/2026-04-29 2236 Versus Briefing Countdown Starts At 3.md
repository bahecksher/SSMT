# 2026-04-29 2236 Versus Briefing Countdown Starts At 3

## TL;DR
- What changed: Fixed the versus lobby countdown so `3` remains visible when both players ready up before the flow launches into MissionSelect briefing.
- Why: The countdown drew `3` and then immediately cleared it, so the visible sequence could start at `2`.
- What didn't work: N/A. Build passed after the fix.
- Next: Two-window playtest the ready-up flow and confirm both clients see `3, 2, 1, GO` before entering briefing.

---

## Full notes

`src/game/scenes/VersusLobbyScene.ts`:

- `beginCountdown()` now clears any prior countdown timer/text before it draws the first countdown value.
- Host path passes `COUNTDOWN_MS` explicitly.
- Guest path now honors the `delayMs` from `MATCH_START` instead of ignoring it.
- Zero-delay countdown still goes straight to handoff, preserving a useful fallback for future payloads.

Verification:

- `npm.cmd run build` passes.
