# 2026-04-09 0041 Boot Loader Minimum Delay

## TL;DR
- What changed: The boot loading screen now stays visible for a minimum of about 4 seconds before transitioning to the menu
- Why: The user wanted enough time to actually read the startup message and see the screen, even on fast loads
- What didn't work: Nothing major failed in implementation; the existing boot flow just needed a minimum-duration gate before `MenuScene`
- Next: Hard-refresh test the startup flow in-browser and confirm the total boot-screen time feels right

---

## Full notes

- Chose ~4 seconds as the midpoint of the requested 3-5 second range
- The delay is a minimum total display time, so slower real loads can still take longer naturally
- `npm.cmd run build` passes
