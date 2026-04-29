# Decisions

Append-only. One entry per decision.

---

### 2026-03-25 — Virtual resolution: 540x960 portrait
Mobile-first, 9:16 aspect ratio. Phaser Scale.FIT handles all device scaling. On desktop the game appears as a centered portrait window.

### 2026-03-25 — Input: pointer-follow with lerp (no virtual joystick)
Phaser's activePointer unifies touch and mouse. Player craft lerps toward pointer position. Simpler and more reliable on mobile than virtual joystick or swipe detection.

### 2026-03-25 — Collisions: manual distance checks, no Phaser physics
Circle-circle and point-to-line-segment are trivial and fast. Avoids Phaser Arcade Physics overhead for a game with simple geometric shapes.

### 2026-03-25 — Rendering: Phaser Graphics objects, no sprite atlas
Neon geometry style maps directly to Graphics draw calls. Zero asset loading needed for gameplay objects. Sprites can replace Graphics later without changing entity logic.

### 2026-03-25 — Systems: plain classes, not Phaser objects
Systems are instantiated in GameScene.create() and have update(delta) called from the scene loop. Keeps them testable and swappable without Phaser inheritance.

### 2026-03-25 — GameState: const object, not enum
TypeScript's erasableSyntaxOnly flag blocks enum syntax. Used `const ... as const` pattern with derived type instead.

### 2026-03-25 — Debris behavior: despawn + respawn (not wrap)
When salvage debris drifts offscreen it despawns and a new one spawns at a random position after ~1.5s delay. Creates brief no-salvage tension windows. User chose this over wrapping.

### 2026-03-25 — Score display: integer only
Accumulated as float internally, displayed as integer in HUD. Cleaner look. User chose this over decimal display.

### 2026-03-25 — Exit gate position: inset ~60px from arena edge
Gate spawns fully visible and player doesn't get pinned against the wall. User chose this over spawning on the very edge.

### 2026-03-26 — Score label: "Credits" (not "Salvage")
The score represents more than just salvage collection. HUD reads "CREDITS:" to reflect broader in-game currency.

### 2026-03-26 — Current game mode is "Quick Play"
The existing arena/extract/score loop is designated as Quick Play mode. Future modes may be added alongside it.

### 2026-03-26 — Beams moved from phase 3 to phase 5
Beam hazards now begin at phase 5 (was phase 3). Enemy ships fill the phase 2-4 threat gap.

### 2026-03-26 — Enemy ships: steering AI with limited turn rate
Enemies steer toward the player with a turn rate cap (2 rad/s), speed 120px/s. They smash through asteroids on contact (split/destroy). Shield absorbs enemy hits and destroys the enemy.

### 2026-03-26 — Hologram visual style: cyan-green + red for danger
All entities use stroke-based rendering with very low alpha fills. Base palette is cyan/green. Hazards (asteroids, enemies, beams) keep red for gameplay readability. Dark green-black background, scanline overlay, per-entity flicker.

### 2026-03-26 — Death effect: 1s freeze then 2x inverted color flash
On death the game freezes for 1 second (all entities visible where they were), then flashes inverted colors twice (red bg, black entities, white player) before transitioning to game over.

### 2026-03-26 — Asteroids and salvage use randomized polygon shapes
Drifters are 5-8 vertex polygons, salvage 6-10 vertex polygons, both with per-vertex radius variation. All spin at random speeds. Collision remains circle-based.

### 2026-03-26 — Death effect changed to static red overlay (no flashing)
Replaced the double inverted-color flash with a static red overlay (0.45 alpha) held for 1 second, then fading out over 300ms. Less jarring on mobile.

### 2026-03-26 — Mobile input: invisible joystick with inertia (not pointer-follow)
Touch input uses an invisible virtual joystick anchored at touch-start point. Drag direction/distance controls thrust. Ship has zero-friction drift (0.99 when not touching), power-1.5 magnitude curve, and anchor re-centering (0.03 rate). Desktop retains pointer-follow. Iteratively tuned across many rounds of mobile playtesting.

### 2026-03-26 — Ship shape: triangle oriented to heading
Player ship is an equilateral triangle (1.3x PLAYER_RADIUS) that rotates to face the direction of travel. Collision remains circle-based (PLAYER_RADIUS = 10).

### 2026-03-26 — Hitboxes are always visible
All entities render their collision circle: player (subtle cyan ring at PLAYER_RADIUS), asteroids (red ring at drifter.radius), salvage (red ring at SALVAGE_KILL_RADIUS = 18).

### 2026-03-26 — Mining zone uses orange pulsing indicators
Asteroid mining zones use orange (0xffaa00) with a pulsing filled circle and rotating dashed ring segments. Much more visible than the previous near-invisible red ring.

### 2026-03-26 — Difficulty rebalanced: enemies phase 5, beams phase 7
Enemy ships now start at phase 5 (was 2), beams at phase 7 (was 5). Concurrent asteroid counts roughly halved. Gives more breathing room to learn controls.

### 2026-03-26 — Player max speed: 750, tuning values
PLAYER_MAX_SPEED = 750. Swipe lerp ranges 0.10–0.25 (scales with magnitude). SWIPE_MAX_DISTANCE = 150, SWIPE_DEAD_ZONE = 0. These are current best-feel values after iterative mobile testing.

### 2026-03-26 — Entry gate: player spawns inside a closing exit gate
On game start, an exit gate appears at the player's spawn point and closes over 5 seconds. Purely cosmetic — gives the impression that the player entered the arena through the gate.

### 2026-03-26 — Health system for salvage and asteroids
Salvage debris has 60s HP (30s for rare), asteroids have 30s×radiusScale HP. Mining/salvaging depletes HP at 1 HP/sec. When HP hits 0, entity flashes for 3 seconds then is destroyed. Adds a resource-exhaustion mechanic.

### 2026-03-26 — Polygon-based hitboxes replace circle collisions
Collision detection now uses point-in-polygon (ray casting) against actual rotated vertices of asteroids, salvage, and enemies. Circle hitbox indicators removed. Player hitbox is its center point only. Beams remain axis-aligned distance checks.

### 2026-03-26 — Player hitbox shrunk to PLAYER_RADIUS=5, visual size decoupled
PLAYER_RADIUS reduced from 10 to 5 (only used for beam collision). Visual triangle uses a fixed VISUAL_SIZE=8 independent of hitbox. A center dot shows the actual hitbox point.

### 2026-03-26 — NPC "other player" ships added (phase 2+)
Amber/yellow NPC ships spawn from off-screen and navigate toward salvage to deplete its HP. Destroyed by asteroids and enemy ships (enemies hunt them). Player can bump NPCs away from salvage but can't destroy them. On hazard death, NPCs drop a shield pickup. Up to 3 concurrent NPCs in later phases.

### 2026-03-27 — Online leaderboard via Supabase (daily/weekly)
Persistent leaderboard using Supabase. Daily (24h) and weekly (7d) tabs on the menu screen, top 10 entries each. No all-time board. Scores submitted on extraction only (death = no submission). Player identity is auto-generated arcade-style: 3 random letters + 4 random digits (e.g. "XKR4281"), stored in localStorage, immutable.

### 2026-03-27 — Leaderboard is fire-and-forget
Score submission and leaderboard fetching are non-blocking. If network fails, game still works — menu shows "OFFLINE" and scores save locally only. No retry logic.
### 2026-03-27 - Callsign format: 2 letters + 3 digits
Player identity now uses two player-chosen uppercase letters plus a persistent random three-digit suffix (example: "AB123"). Existing saved callsigns are migrated to the new format by keeping the first two letters and last three digits when possible.

### 2026-03-27 - Arena layout: viewport-responsive canvas and bounds
The Phaser canvas now resizes to the browser viewport instead of staying at a fixed 540x960 portrait surface. Arena bounds, spawns, HUD placement, overlays, and starfields read runtime layout metrics so the starfield fills the page and the arena shape adapts to the device/browser size.

### 2026-03-27 - Pause control: bottom button with abandon option
The run can now be paused from a bottom-centered screen button during countdown and gameplay. The pause menu offers `RESUME` and `ABANDON RUN`, and abandoning returns directly to the main menu without banking the current run.

### 2026-03-27 - Pause button label uses the pause symbol
The bottom in-run pause control now shows `||` instead of the word `PAUSE`. The paused-state toggle still reads `RESUME` so the recovery action stays explicit.

### 2026-03-27 - Pause resume uses a frozen 3-2-1-GO countdown
Leaving the pause menu does not resume immediately. The game now stays frozen through a centered `3`, `2`, `1`, `GO` countdown and only then restores the previously paused run state.

### 2026-03-27 - Pause is now crawl-speed danger, not a true freeze
The pause menu no longer fully freezes the run and no longer uses a resume countdown. While paused, the simulation continues at an extremely slow crawl with player control disabled, so hazards can still drift into lethal collisions but the slowed state is not practical for real play.

### 2026-03-27 - Post-run progression freezes while background motion continues
After death or extraction, phase timers, gate progression, spawns, and reactive phase/gate lines stop advancing. The background keeps already-spawned objects moving visually behind the overlay, but the run state itself is frozen at the moment it ended.

### 2026-03-27 - Callsign format restored to AAA-###
Player identity now uses three editable uppercase letters plus a persistent three-digit suffix, displayed as `AAA-###`. Existing saved callsigns migrate by preserving available letters and the last three digits, padding a missing third letter when needed.

### 2026-03-27 - Phase 6: Settings, bomb power-up, screen shake, collection delays
Settings system persists screen shake and scanline toggles to localStorage. Accessible from both the pause menu and the main menu. Bomb power-up drops from enemies (25% chance) with a 1.5s collection delay; once collected, a BOMB button appears in the bottom-right. Detonation clears all entities except the player with a white flash + camera shake. The same 1.5s collection delay applies to bonus point pickups from enemies. Flash+shake fires on game entry, extraction, and bomb detonation. Death triggers a screen shake.

### 2026-03-27 - Board wipe: full white flash with hold + fade on bomb, game start, and extraction
The board wipe effect (white flash at full opacity, 150ms hold, 600ms fade-out) now fires on bomb detonation, game start (countdown "GO"), and successful extraction. All hazards, enemies, salvage, and pickups are cleared in each case. New salvage respawns after 800ms on bomb/game-start; extraction transitions to results.

### 2026-03-27 - Debug spawn menu in pause screen
A "DEBUG SPAWN" section in the pause menu lets the player spawn shields, bonus points, bombs, salvage, rare salvage, small asteroids, large asteroids, and mineable asteroids near the arena center. Intended for playtesting only.

### 2026-03-27 - Board wipe shatters entities into debris
Board wipe (bomb, game start, extraction) now spawns ShipDebris fragments for every entity before destroying it, so nothing silently vanishes. Flash holds 200ms at full white, fades over 1000ms.

### 2026-03-27 - NPC shield-kills drop bonus pickups
When the player's shield destroys an unshielded NPC, a bonus point pickup (70 pts) drops with the standard 1.5s collection delay — same as enemy kills.

### 2026-03-27 - Salvage redesigned as modular rectangles
Salvage debris changed from random polygon blobs to 2-3 perpendicular rectangular modules arranged edge-to-edge (space station style). Normal shape radius 80px, rare 45px ��� clearly larger than the biggest asteroids. Collection radius reduced from 120 to 80.

### 2026-03-27 - Mining ring tightened to 1.8x asteroid radius
DRIFTER_MINING_RADIUS_MULT reduced from 3.5 to 1.8. Keeps the proximity-based points mechanic but prevents oversized rings on large asteroids.

### 2026-03-27 - Extraction dialogue always triggers
Slick's extraction line changed from 55% chance to guaranteed. Important moment should never be silent.

### 2026-03-28 - Beams obliterate all entities
Lethal beams now destroy asteroids (shatter into debris), enemies (drop bonus), NPCs (drop shield/bonus), and salvage on contact. Beam width scales aggressively per phase (1.4x exponential from base 20px, capped at 120px).

### 2026-03-28 - Beams and enemies both start at phase 5
Beams moved from phase 7 to phase 5 to coincide with enemy introduction. Frequency starts gentler (10s) and ramps to 2.5s. Burst system at phase 8+ fires beams in rapid succession (200-500ms apart).

### 2026-03-28 - Bombs detonate on pickup (no button)
Bomb power-up now triggers board wipe immediately on player collection. The BOMB button, HUD indicator, and held-bomb state are removed. When an NPC collects a bomb, it also triggers the board wipe and kills the player.

### 2026-03-28 - Pickups carry full inertia like shields
Bonus point pickups and bombs no longer have velocity friction (was 0.988 damping). They drift at constant speed matching shield behavior and can exit the arena.

### 2026-03-28 - Small asteroids have no mining circle
Mining rings and proximity scoring now require radiusScale >= 1.5. Small and normal-sized asteroids no longer show the collection circle or count as mineable.

### 2026-03-28 - Salvage has no collision with asteroids
Salvage drifts through the asteroid field unaffected. Bounce and break-apart collision were both tried and felt wrong.

### 2026-03-28 - Regent triggers on all deaths at phase 5+
At phase 5 and above, Regent delivers the kill taunt on every death regardless of cause (asteroid, beam, enemy, or bomb). Below phase 5, Slick handles death lines.

### 2026-03-28 - Pause resume only via top-right button
The pause menu panel no longer has a resume button or play icon. Resume is accessed exclusively via the top-right ▶/|| toggle button.

### 2026-03-28 - Mission system: pre-game briefing with 9 mission types
Optional per-run objectives chosen on a MissionSelectScene between Menu and Game. 9 mission types across 3 difficulty tiers. Mission cards persist in localStorage; progress resets each run. Rewards are bonus credits added to banked score on extraction only. Retry skips the briefing and reuses the same mission cards.

### 2026-03-28 - Mission progress resets on death (per-run model)
Mission progress resets each run, consistent with unbanked credits being lost on death. The mission cards themselves persist across sessions until completed (claimed on extraction) or discarded (replaced with new random mission).

### 2026-03-28 - BankingSystem separated detection from finalization
BankingSystem.checkExtraction() now only banks the score and returns boolean. New finalizeExtraction() saves best score and submits to leaderboard. This allows mission bonus credits to be added between banking and leaderboard submission.

### 2026-03-28 - Mission select uses swipe gestures instead of hold-to-discard
Swipe right to accept (card snaps right into frame), swipe left for pending discard (card snaps left), second swipe left confirms discard. Replaces the hold-to-discard mechanic which was clunky on mobile. 40px drag threshold.

### 2026-03-28 - In-game mission HUD uses pill-shaped indicators at bottom
Mission progress during gameplay shown as evenly spaced rounded-rect pills across the bottom of the screen instead of stacked 10px text. More readable and identifiable at a glance.

### 2026-03-28 - Comm panels wipe in horizontally on death/extraction
Slick wipes in from the left, Regent from the right (Back.Out ease, 280ms). Normal in-gameplay comms retain the slide-down animation. Adds visual impact to the results moment.

### 2026-03-28 - Mission select replaced hold-to-discard with REROLL ALL button
Multiple swipe and hold-to-discard iterations failed on mobile. Replaced with a simple REROLL button that regenerates all 3 missions (none carried over). Limited to 3 rerolls, replenished by 1 per successful extraction.

### 2026-03-28 - Company reputation system with 4 factions
4 companies (DEEPCORE, RECLAIM, IRONVEIL, FREEPORT) issue missions. Completing missions awards rep (tier 1=1, tier 2=2, tier 3=4). Rep thresholds at 3/8/16 unlock escalating per-run boosts: mining yield, salvage yield, NPC bounty multiplier, and bonus drop rate.

### 2026-03-28 - Mission data in hand-editable template file
Mission definitions extracted to `src/game/data/missionData.ts` as plain data arrays with `labelTemplate` strings using `{target}` placeholder. Generation logic stays in `missionCatalog.ts`.

### 2026-03-28 - Liaison NPCs appear at rep level 1+
When the player has rep >= 1 with any company, the highest-rep company's liaison (Holt/Voss/Kade/Nyla) appears during countdown with intro and boost announcement lines. Each has a unique portrait shape and company-colored comm panel.

### 2026-03-28 - Reputation unlocks spendable favors; Slick keeps 65%
Company rep no longer auto-applies passive boosts on deploy. Rep now unlocks tiered favor offers on MissionSelect, successful extraction still scores at 100% for best score and leaderboard, and only 35% of extracted credits become persistent wallet money while Slick keeps the other 65%. Death retry preserves the already-purchased favor loadout; changing favors after a completed run requires returning to MissionSelect.

### 2026-03-29 - MissionSelect shows company standing on each favor card
Company status stays on the main MissionSelect grid instead of moving to a separate detail panel. Each favor card shows liaison info, current standing, raw rep, next threshold, and the actual offer so all four companies can be compared at a glance on phone-sized screens.

### 2026-03-29 - Slick cut scales with career banked credits
Slick no longer takes a flat 65% forever. Save data now tracks cumulative career banked credits, and the split improves at 5k / 15k / 30k career banked so the player moves from 35/65 to 40/60, 45/55, and finally 50/50. Current wallet balance does not affect the deal.

### 2026-03-29 - Slick split simplified to a fixed 60/40
The progressive Slick deal was removed. From the start, the player always keeps 60% of extracted credits for wallet money and Slick always takes 40%. This is easier to read and explain than a scaling deal track.

### 2026-03-29 - Favors are premium purchases, not routine loadout picks
Favor pricing was moved into the several-exfils range so basic favors cost around 7.5k-9k and higher tiers climb sharply from there. The intent is that buying a favor feels like a deliberate commitment rather than something expected every run.

### 2026-03-29 - Mission rerolls cost stacking wallet credits
Mission rerolls now cost both a reroll charge and wallet credits. Within a single MissionSelect visit, the costs step up from 200c to 400c to 600c. This makes rerolling a real spend decision without needing a more complex reroll economy.

### 2026-03-29 - Cursor morphs to hug interactive elements iPad-style
The hologram reticle cursor now smoothly morphs into a rounded rectangle that hugs interactive buttons when hovered, inspired by iPadOS cursor behavior. Reticle crossfades out, rect fades in, position sticks to element center, and a small neon dot tracks the actual pointer. Each interactive zone is tagged with its visual corner radius via `setData('cornerRadius', N)` so the morph rect matches precisely.

### 2026-04-02 - Favors are fixed liaison purchases; rep identifies leaderboard company
MissionSelect favors no longer unlock or scale from reputation. Each liaison always sells one fixed favor, while accumulated rep is now used to determine the pilot's leaderboard company affiliation based on the highest saved company rep.

### 2026-04-02 - Adaptive music uses provided state-specific loops
The soundtrack now uses the user-provided `Menu Synth`, `Bass 1`, `Drums 3`, `Bass 3`, `Synth 3`, `Full Phase 1`, and `Full Phase 2` exports. Menu/pause/result states anchor to `Menu Synth`, MissionSelect layers `Bass 1` under it, gameplay adds the three phase stems by progression, and phase 6+ hands off to a single randomly chosen full-track loop for the rest of the run.

### 2026-04-02 - Early gameplay keeps Bass 1; full-track handoff starts at phase 5
After the first soundtrack integration pass, the early gameplay arrangement was tightened so `Bass 1` continues under `Drums 3` for phases 1-2, then phase 3 swaps to `Bass 3` and adds `Synth 3`. The single full-track takeover now starts at phase 5 instead of phase 6.

### 2026-04-02 - Music now defaults on
Music no longer defaults to off in saved settings. New installs start with music enabled, and the settings version was bumped so older local saves adopt the new default once.

### 2026-04-02 - SFX use the shared FX volume and pickup doubles as UI click
The provided gameplay sounds are now preloaded through a shared SFX helper that respects `FX VOL`. `Pick Up` is used both for gameplay pickup collection and for menu / MissionSelect / pause / result UI selections, while the other provided clips map to shield loss, asteroid impact, bomb detonation, player death, and first enemy entrance.

### 2026-04-02 - Early phase music now ramps through Drums 2 before the late-game swap
MissionSelect now plays `Bass 1` alone. Gameplay uses `Bass 1` for phase 1, adds `Drums 2` at phase 2, adds `Synth 3` at phase 3, swaps to `Bass 3` + `Drums 3` + `Synth 3` at phase 4, and hands off to a random full-track loop at phase 5+.

### 2026-04-03 - NPC deaths use the death cue; enemy warning now leads phase 5
The `Player Death` clip now also marks NPC kills, including hazard kills and player shield crashes into NPCs. The opening phase-1 board wipe now uses the bomb cue, and the first enemy warning SFX was moved from first visible spawn to the phase 5 transition so it lands before enemies appear.

### 2026-04-03 - Favors cost 2000 and cap at two armed per run
All four liaison favors now cost a flat `2000c`. MissionSelect allows at most two favors to be armed at once, so the player can stack a pair of boosts without defaulting into all-company loadouts.

### 2026-04-03 - Comm portraits use layered holo rendering
Slick, Regent, and the four liaison portraits now use layered translucent hologram styling instead of simple outline-only vector shapes. Slick's portrait silhouette was also softened so the character reads more feminine while staying within the existing portrait framing.

### 2026-04-03 - Slick portrait reads as a humanoid holo operator
Slick's portrait should read as a recognizable humanoid face rather than a masked helmet silhouette. The holo portrait now emphasizes hair framing, brows, eyes, nose, lips, and a softer jawline so the feminine read survives even at comm-panel scale.

### 2026-04-03 - Comm portraits omit mouth marks
The cast portraits should not show explicit mouths or lower-face grin bars. Slick, Regent, and all liaison portraits now rely on eyes, brows, silhouette, and panel shapes for expression instead of mouth lines.

### 2026-04-06 - Phase 10 uses a single edge-running gunship boss
Phase 10+ now swaps regular enemy/beam pressure for a gunship that patrols arena edges with destroyable beam guns. Shield rams break the guns, exposing a core that is finished by a shielded in-and-out breach, and the kill explodes into a debris field of real hazards rather than ending the run immediately.

### 2026-04-06 - Gunship lasers cycle through safe, warning, and firing states
The phase 10 gunship no longer projects permanently lethal beams. Its guns now pulse through a readable safe window, visible warning telegraph, and short lethal firing burst so players can route around the edge sweep instead of treating the whole pass as a constant wall.

### 2026-04-06 - Hostile lane now shares one color and the gunship fires in staggered waves
The phase 10 gunship now uses more destroyable guns with staggered beam timing instead of synchronized volleys, and the gunship, beam hazards, enemy ships, and NPC ships now share the same hostile color family for a more unified screen read.

### 2026-04-06 - Default blue hostile lane uses Regent red instead of orange
On the default blue palette, gameplay hostiles now use the old NPC / Regent red family rather than the previous orange enemy tone so the gunship, beams, enemies, and NPC ships feel more aligned with Regent's visual identity.

### 2026-04-06 - Asteroids now use neutral grey shades
Asteroids no longer use the bright orange lane. Across palettes, mineable and inert asteroids now render in light and dark greys to reduce visual clutter and let salvage and hostile factions carry more of the color contrast.

### 2026-04-06 - Default blue player color shifted to brighter cyan
On the default blue palette, the player ship now uses a brighter cyan instead of the older cooler blue so the player reads more clearly against the darker arena and the newly neutralized asteroid field.

### 2026-04-06 - Palette rotation now includes additional neon themes
The palette switchers now rotate through extra neon colorways beyond the original four. New `VOLT`, `PULSE`, and `FROST` themes widen the visual range without adding a separate rendering-mode toggle.

### 2026-04-06 - Shields now use white across palettes
Shields no longer carry their own blue tint. The shared shield lane is now white so pickups, shield bubbles, shield HUD, and shielded NPC rings read more cleanly against the broader neon palette range.

### 2026-04-07 - Favors again scale with company standing and use percent copy
MissionSelect favors no longer stay pinned to one flat mid-tier offer. Each company's favor is locked at `UNKNOWN`, upgrades through `KNOWN` / `TRUSTED` / `ELITE`, and now costs `1000c` / `2000c` / `3000c` for those three tiers. Favor text now uses percentage-style copy across the board, so multiplier boosts like mining, salvage, and NPC bounty read as `+15%`, `+30%`, or `+200%` instead of mixed `x1.15` and `%` formats.

### 2026-04-07 - Deepcore's secondary mission now tracks broken asteroids instead of held unbanked credits
The old `HOLD {target} UNBANKED` contract was misleading because mission rewards still only pay out on extraction. Deepcore's secondary mission now asks the player to `BREAK {target} ASTEROIDS`, and progress only comes from player-caused mineable asteroid breaks such as mining depletion or shield rams. Persisted legacy `HOLD` cards are dropped from saved mission state and replaced by freshly generated current-format missions.

### 2026-04-07 - Campaign sessions track completed mission count across runs
Campaign mode now keeps a session-local mission completion total alongside lives and carried favors. The count only increases when completed missions are actually claimed on a score-recorded campaign extraction, persists across later campaign runs and deaths, and resets when the campaign session ends or a new campaign starts.

### 2026-04-14 - Corporation affiliation stays rep-driven for leaderboard identity
The new corporation leaderboard and arena identity use the pilot's highest saved company rep as the current affiliation. We are not adding a separate corporation enlistment picker yet; the game already tracks rep per company, score submission already tags runs with that affiliation, and the smaller change keeps the feature aligned with existing progression.

### 2026-04-14 - Accessible game flow is arcade-only for now
Campaign mode is no longer exposed in the menu or allowed through normal scene handoffs. The saved selected mode now normalizes back to `ARCADE`, and stale campaign mode entries are prevented from reopening the unfinished flow, while the deeper campaign-only data structures remain in code for a later revisit instead of being ripped out in the same pass.

### 2026-04-14 - Corporation affiliation is now manually selectable in the menu
The `WORKING WITH` slot on the main menu is now an explicit corporation selector instead of read-only highest-rep text. A player's chosen corporation drives leaderboard tagging and corporation-colored UI/arena presentation, while highest saved rep remains only as the fallback when no manual selection has been made yet.

### 2026-04-14 - Manual corporation choices are gated by earned rep
The main-menu corporation selector no longer cycles through every faction by default. Players can always remain `FREE AGENT`, but the only corporations they can explicitly choose are the ones where they currently have positive saved rep.

### 2026-04-14 - MissionSelect surfaces rep payout and current company standing
MissionSelect should show both sides of company progression at the point of choice. Contract cards now surface the rep payout awarded on completion, while favor cards show each corporation's current standing, raw rep total, and progress toward the next tier so players can judge both short-term and long-term value on the same screen.

### 2026-04-14 - Rep gain rules are stated before and after a run
The UI should not make players infer how company reputation works from thresholds alone. MissionSelect now explicitly says accepted contracts pay bonus credits and company rep on extraction, locked favor cards point players toward completing contracts, and extraction results report the rep actually claimed so the earn loop is visible end-to-end.

### 2026-04-29 - Constrained mobile rendering now auto-reduces vector load
Phone-sized narrow/short viewports now automatically use a reduced render profile instead of the full visual density. Gameplay gets fewer slower-redrawn stars, the shared geo-sphere uses lower detail and a slower redraw cadence, mirrored-versus repainting is throttled, and repeated dashed-ring effects are simplified. The intent is to prioritize framerate on constrained mobile devices without removing the holo/vector look outright.

### 2026-04-29 - Constrained live versus mirror favors framerate over full ghost detail
On narrow/short phone-sized viewports, live versus no longer renders the peer's full enemy ghost field or the live arena tint behind gameplay. The peer ship and status remain, and full-detail peer rendering still returns during spectate. This keeps the core versus read while cutting the heaviest newly introduced render path on constrained mobile.
