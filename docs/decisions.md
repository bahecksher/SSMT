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
