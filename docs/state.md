# State
_Last updated: 2026-04-07 0055_

## Current focus
MissionSelect readability cleanup around the restored favor economy, alongside ongoing phase 10 gunship tuning and palette polish.

## What's working
- Menu, Mission Select, save data, and results support distinct `CAMPAIGN` and `ARCADE` modes with separate wallets and campaign life / favor carryover
- Company favors are again locked at `UNKNOWN` and scale through `KNOWN`, `TRUSTED`, and `ELITE` tiers with standardized prices of `1000c`, `2000c`, and `3000c`
- Favor boost copy now uses percentage formatting consistently, so mining, salvage, NPC bounty, and drop-rate cards all read in the same `%` language
- MissionSelect dims locked favor cards, shows `KNOWN AT 3 REP`, and blocks selection until a company reaches the first standing tier
- MissionSelect's wallet header now uses the cleaner UI font at a slightly larger size instead of bold LCD title styling, improving readability on the long `CAMPAIGN WALLET` line
- Phase 10+ swaps regular enemy/beam pressure for a gunship boss that patrols arena edges, keeps surviving guns between passes, exposes a core after all guns are broken, and explodes into a dense debris field on death
- Gunship now uses a much larger, sharper blade-shaped silhouette with five destroyable guns and staggered beam timing instead of a single synchronized volley
- On the default blue palette, gunship, beam hazards, enemy ships, NPC ships, and the death-results `DESTROYED` title read in the Regent-style red family instead of the older orange enemy tone
- Asteroids now use neutral grey shades across palettes, which also carries through their mineable rings, HP bars, and breakup debris
- On the default blue palette, the player ship now uses a brighter cyan instead of the older cooler blue
- Palette rotation now includes three additional neon themes: `VOLT`, `PULSE`, and `FROST`
- Shields now use white across all palettes, which carries through pickups, active shield bubbles, HUD shield text, and shielded NPC rings
- MissionSelect settings now include the same palette swap control as the main menu and preserve current favors / reroll visit state when the scene restarts for a palette change
- Pause menu includes a `DEBUG PHASE` section with jump buttons for phases 1-10 that reset the board, rebuild phase state, and resume directly into the chosen phase
- Using a debug phase jump blocks run score recording: no leaderboard submission, no best-score save, no wallet payout, and no campaign life loss from that run
- `npm.cmd run build` passes

## In progress
- Live tuning for phase 10 stagger spacing, beam safe-window length, shield pacing, debris density, and final color balance across the player / salvage / hostile lanes
- Validation of whether carried campaign favors should follow current standing or preserve the exact tier that was active when armed
- Small readability passes on dense MissionSelect headings and labels as they surface in playtesting

## Known issues
- Local `BEST` score is still shared across campaign and arcade even though leaderboard submission is arcade-only
- Background simulation (~180 lines) duplicated between MenuScene and MissionSelectScene - candidate for extraction to a shared BackgroundSimulation class
- Settings UI duplicated across MenuScene, MissionSelectScene, and GameScene pause menu - candidate for a shared SettingsPanel component
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Soundtrack and SFX still need a real feel pass for balance, overlap, and loudness
- Retry/continue after extraction still bypasses MissionSelect for a direct next run
- Beam hazards still span full screen width/height, not clipped to arena
- Boss encounter balance is not tuned yet for all screen sizes or for long post-kill survival windows
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Supabase `scores` still needs a nullable `company_id` column added server-side

## Next actions
1. Play MissionSelect in both campaign and arcade to confirm the updated wallet header remains readable on short and long wallet strings
2. Decide whether carried campaign favors should preserve their purchase tier or continue following current company standing
3. Keep using the pause-menu phase jump to tune the phase 10 gunship cadence and post-kill debris pressure

## Active plan
docs/plans/2026-04-07 0052 Plan - Favor Tier Return.md

## How to verify
1. Run `npm.cmd run build`
2. Open MissionSelect in campaign mode and confirm `CAMPAIGN WALLET` reads more clearly than before on the favor header
3. Open MissionSelect in arcade mode and confirm the shorter `ARCADE WALLET` line still centers and fits cleanly
4. Confirm low-rep favor cards still read `KNOWN AT 3 REP` and high-rep cards still show `1000c`, `2000c`, and `3000c`
5. Confirm favor boost lines still display percentage copy instead of mixed `x1.15` and `%` formats

## Recent logs
- docs/log/2026-04-07 0055 MissionSelect Wallet Header Readability.md - switched the MissionSelect wallet header to a cleaner, larger non-bold font treatment
- docs/log/2026-04-07 0052 Favor Tier Return and Percent Copy.md - restored standing-based favor tiers and unified favor copy to percentage formatting
- docs/log/2026-04-06 2320 White Shields.md - changed the shared shield color lane to white across all palettes
