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
