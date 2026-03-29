# 2026-03-29 1825 Music Default Off and Beta Tag

## TL;DR
- What changed: Switched the new music feature to default off and marked it with a visible `*BETA*` tag in both settings UIs.
- Why: The current test soundtrack is promising, but it should stay opt-in while the feature and mix are still in development.
- What didn't work: Nothing major; this was a small UI/settings pass.
- Next: Keep the music framework in place, listen for any feel issues, and swap in future stems without changing the system wiring.

---

## Full notes

Updated `SettingsSystem` so `musicEnabled` defaults to `false` for fresh settings data.

Added visible beta labeling in both places players can control the feature:
- Menu settings panel: `MUSIC` row now includes a `*BETA*` tag
- Pause settings: music toggle now has a matching `*BETA*` tag underneath

Validation:
- `npm.cmd run build` passed after the changes

Intent:
- keep the adaptive music framework intact
- keep the test soundtrack available for opt-in listening
- signal clearly that the feature is still being tuned and may change
