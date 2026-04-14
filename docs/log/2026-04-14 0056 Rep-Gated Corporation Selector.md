# 2026-04-14 0056 Rep-Gated Corporation Selector

## TL;DR
- What changed: Limited the corporation selector so it only cycles through corporations where the player has earned rep, while keeping `FREE AGENT` available.
- Why: The user wanted corporation choice to be restricted to corporations the player actually has standing with.
- What didn't work: Nothing notable; the shared affiliation helper was updated and the build passed cleanly.
- Next: Playtest the selector with different rep states to confirm locked corporations stay unavailable and unlocked ones remain selectable after reload.

---

## Full notes

- Added a helper that derives selectable corporations from positive saved rep.
- Updated the shared affiliation helper so stale saved corporation selections are ignored unless that corporation is currently unlocked by rep.
- The menu selector now cycles through `FREE AGENT` plus only the unlocked corporations, and shows `EARN REP TO UNLOCK` when no corporations are unlocked yet.
- Confirmed the project still builds successfully with `npm.cmd run build`.
