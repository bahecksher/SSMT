# 2026-03-29 0213 Favor Font Size Pass

## TL;DR
- What changed: increased the MissionSelect favor-section font sizes together and raised the favor-card height to give the larger text room
- Why: the favor area was too small and hard to read
- What didn't work: no runtime blocker; this pass only needed a build check
- Next: sanity-check the favor section on a short phone-sized viewport to make sure the larger text still fits comfortably

---

## Full notes

- Increased the `WALLET` header size above the favor grid.
- Bumped favor-card title, standing, offer, detail, and badge text sizes together in `src/game/scenes/MissionSelectScene.ts`.
- Increased favor-card height and the responsive favor-card height clamp so the larger copy has more breathing room.
- Verified with `npm.cmd run build`.
