# 2026-04-07 0132 Campaign Mission Completion Tracking

## TL;DR
- What changed: Campaign sessions now persist a `missionsCompleted` count, increment it on score-recorded campaign extractions when missions are claimed, show it in the top HUD during campaign runs, and show it on campaign result screens.
- Why: The player wanted campaign progress to track how many missions were completed across the whole campaign, not just per-run mission cards.
- What didn't work: Nothing failed in implementation, but I avoided extending the already-dense MissionSelect wallet header so this wouldn't reintroduce readability issues there.
- Next: Play a campaign with at least one completed mission to confirm the counter persists across lives/runs and resets on a new campaign.

---

## Full notes

This session intentionally diverged from the active mining-mission plan because the user requested a new campaign progression stat. I kept the change small and localized:

- Extended `CampaignSessionSave` / `SaveSystem` with a `missionsCompleted` field, including migration for older saves that do not have the new property yet.
- Added a campaign-only increment path that only fires when completed missions are actually claimed on a score-recorded extraction.
- Preserved the total through campaign deaths and exposed it even on campaign game over, when the session itself has already been cleared.
- Surfaced the total in the campaign HUD as a compact `// MISS {n}` tag beside the existing credits/lives lane and on the result screen as `MISSIONS COMPLETED: {n}`.

Verification:

- `npm.cmd run build`
