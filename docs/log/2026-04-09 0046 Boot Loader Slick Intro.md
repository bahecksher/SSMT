# 2026-04-09 0046 Boot Loader Slick Intro

## TL;DR
- What changed: The boot loading screen now shows a Slick intro line from the existing `menuIntro` voice pool beneath `Establishing Secure Connection...`
- Why: The user wanted the startup screen to help introduce the world of Slick's instead of feeling purely technical
- What didn't work: Nothing major failed; the main adjustment was giving the panel enough height for the extra line without crowding the loading bar
- Next: Hard-refresh test the startup flow in-browser and make sure the added flavor line reads cleanly at boot

---

## Full notes

- Reused the existing Slick line source instead of inventing new copy, so boot and menu stay in the same voice
- The boot intro line now varies from the same menu intro pool while avoiding immediate repeats through the shared line-picker helper
- `npm.cmd run build` passes
