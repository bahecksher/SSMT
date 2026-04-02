# 2026-04-02 1747 Fixed Liaison Favors and Leaderboard Company Tags

## TL;DR
- What changed: Simplified favor cards to fixed liaison offers, removed rep standing/progress text from that UI, and threaded company affiliation into leaderboard submit/fetch/render.
- Why: Rep-driven favor scaling was cluttering the cards, and rep is now being repurposed as the signal for which company a leaderboard pilot works for.
- What didn't work: The first build caught a typed fallback issue in the new leaderboard fetch path, which was then fixed. Server-side `company_id` still needs to be added before the new field persists remotely.
- Next: Run the Supabase migration, then playcheck MissionSelect and menu leaderboard rows on a phone-sized viewport.

---

## Full notes

- Updated [companyData.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/data/companyData.ts) so favors are fixed per company, run boosts no longer depend on rep level, and leaderboard affiliation resolves from the highest saved company rep.
- Updated [MissionSelectScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/MissionSelectScene.ts) so favor cards no longer render standing/raw rep/next-threshold copy or the rep progress bar, and instead read as fixed liaison purchases.
- Updated [BankingSystem.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/systems/BankingSystem.ts), [LeaderboardService.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/services/LeaderboardService.ts), and [MenuScene.ts](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/src/game/scenes/MenuScene.ts) so score submissions include an optional `company_id`, fetches tolerate pre-migration servers, and rendered leaderboard rows show compact company tags/colors when present.
- Added the direction change to [2026-04-02 1747 Spec - Fixed Liaison Favors and Leaderboard Companies.md](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/docs/spec/2026-04-02 1747 Spec - Fixed Liaison Favors and Leaderboard Companies.md) and appended the superseding decision in [decisions.md](/c:/Users/brett/OneDrive/Desktop/Bit-P-AI-lot/docs/decisions.md).
- Verified with `npm.cmd run build`.
