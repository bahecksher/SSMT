# 2026-05-01 2042 Four Player Death Screen Direction

## TL;DR
- What changed: No code changes. Captured design direction for death screens in 3-4 player Versus.
- Why: User pointed out only one player can reasonably watch the last survivor in the current 1v1-style broadcast model.
- What didn't work: Full implementation still pending.
- Next: Build sender-keyed peer maps, then live terminal scoreboard.

---

## Full notes

Direction:

- Keep 1v1 Versus as-is with lasers and death/spectate screens.
- In 3-4 player rooms, terminal players should not be forced into one broadcast view.
- Death/extract screen should show a live scoreboard for every pilot:
  - callsign
  - score
  - phase
  - state: alive, extracted, destroyed, left
  - rank/leader highlight
- Terminal players can select one live target to spectate fullscreen and sabotage.
- Laser-only sabotage is the clean first version for 3-4 player rooms.

Fairness ideas:

- One selected target at a time.
- Visible incoming warning on the target's screen.
- Charge/cooldown throttling.
- Optional target switching cooldown.
- Queue or space incoming lasers if multiple dead players target the same survivor.
- Keep repulsors out of 3-4 player rooms initially; they can stay in 1v1 or become a later chaos setting.
