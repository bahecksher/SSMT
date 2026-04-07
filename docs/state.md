# State
_Last updated: 2026-04-07 0132_

## Current focus
Campaign progression readability, mission objective cleanup around the restored favor economy, and ongoing phase 10 gunship tuning.

## What's working
- Menu, Mission Select, save data, and results support distinct `CAMPAIGN` and `ARCADE` modes with separate wallets and campaign life / favor carryover
- Deepcore's old `HOLD UNBANKED` contract has been replaced by `BREAK ASTEROIDS`, which now progresses from player-caused mineable asteroid breaks instead of temporary unbanked-credit thresholds
- Legacy saved `HOLD` mission cards are filtered out of persisted mission state and replaced by current-format contracts on load
- The menu no longer shows the extra `MODE` heading above the `CAMPAIGN` / `ARCADE` buttons, leaving that choice area cleaner and more self-explanatory
- The menu mode helper text under the `CAMPAIGN` / `ARCADE` buttons now renders as a fixed two-line block, keeping wallet and mode-summary copy from getting cut off
- During campaign runs, the HUD now lists remaining lives beside the credits above the arena, and the `LIVES` tag now matches the credits line's font, size, and color treatment
- Campaign mode now tracks a session-local completed mission count, shows it in the top HUD as `// MISS {n}`, and surfaces the same total on campaign result screens
- The gameplay countdown now uses the title font instead of the older UI-font treatment, so the pre-run phrases match the newer headline styling
- Death/game-over results now use banked credits as the main score readout and show unbanked loss as a separate line when applicable
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
- Small readability passes on dense Menu, MissionSelect, and HUD labels as they surface in playtesting

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
1. Play a Deepcore mission set and confirm `BREAK ASTEROIDS` progresses from mining depletion and shield crashes, but not from unrelated board wipes
2. Complete one or more missions across a score-recorded campaign extraction and confirm the campaign mission total increments, persists into the next life/run, and resets on a new campaign
3. Die after banking and after carrying unbanked credits to confirm the game-over screen now emphasizes banked score while still surfacing what was lost

## Active plan
docs/plans/2026-04-07 0120 Plan - Mining Mission Asteroid Break Swap.md

## How to verify
1. Run `npm.cmd run build`
2. Open MissionSelect until a Deepcore secondary contract appears and confirm it now reads `BREAK {target} ASTEROIDS`
3. Start a run with that contract and confirm the mission advances when you mine a mineable asteroid to depletion
4. In campaign mode, complete at least one mission and extract; confirm the HUD and result screen show the updated campaign mission total
5. Start the next campaign run or lose a life and confirm the mission total persists until the campaign ends
6. Bank some credits, then die, and confirm the result screen shows `CREDITS BANKED` as the main score line plus `UNBANKED LOST` when applicable

## Recent logs
- docs/log/2026-04-07 0132 Campaign Mission Completion Tracking.md - added persistent campaign mission completion tracking to campaign session state, HUD, and result screens
- docs/log/2026-04-07 0126 Death Results Show Banked Score.md - changed death/game-over results to show banked credits as the main score and unbanked loss as secondary detail
- docs/log/2026-04-07 0124 Countdown Title Font.md - changed the gameplay countdown phrases from the UI font to the title font
- docs/log/2026-04-07 0123 Campaign HUD Lives Match Credits.md - restyled the campaign lives tag to match the credits line above the arena
