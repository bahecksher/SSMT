# 2026-05-18 1249 Rival One HP Flee Roll

## TL;DR
- What changed: Corrected Redline's low-HP behavior so the flee roll happens after she reaches 1 HP instead of sometimes destroying her on that hit.
- Why: Rivals should keep their 3 HP structure; the 75% roll decides whether they run at 1 HP, not whether the 1 HP hit kills them.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Test both outcomes: flee at 1 HP and stay vulnerable at 1 HP.

---

## Full notes

Behavior now:
- Redline starts with 3 HP.
- A hit that would reduce her to 1 HP sets her to 1 HP.
- At 1 HP, she has a 75% chance to flee.
- If the flee roll fails, she remains active at 1 HP.
- A later hit while she is at 1 HP destroys her.
- A hit while she is already fleeing also destroys her.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
