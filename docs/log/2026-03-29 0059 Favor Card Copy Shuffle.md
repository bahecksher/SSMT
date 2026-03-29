# 2026-03-29 0059 Favor Card Copy Shuffle

## TL;DR
- What changed: moved `liaison // role` onto the company line and removed the locked-only `KNOWN FAVOR AT 3 REP` helper line from favor cards.
- Why: the card copy needed to be lighter and the liaison info needed to sit closer to the company identity.
- What didn't work: nothing blocked this pass.
- Next: validate the updated favor-card line breaks on a short phone viewport.

---

## Full notes

- Updated `MissionSelectScene` so the company line now includes company name plus `liaison // role`.
- Removed the separate liaison row from favor cards.
- Removed the locked-only helper line so locked cards stop carrying that extra copy.
- Kept the standing and offer lines intact so the company status still reads at a glance.
- Verified the change set with `npm.cmd run build`.
