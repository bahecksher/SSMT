You are helping me build an original browser game in TypeScript using Phaser 3 and Vite.

This game is an ORIGINAL spiritual successor to a minimalist arcade dodge game, but it must NOT copy any existing game's title, assets, text, music, code, UI, or exact presentation. The implementation, names, visuals, sounds, and mechanics details must be original. Keep the game minimalist, readable, and highly replayable.

## Product Goal

Build a browser-based 2D arcade survival-extraction game with fast pointer/touch controls.

Core fantasy:
- pilot a small craft through a hazard-filled field
- stay near a large drifting wreck to salvage points
- survive escalating danger
- decide whether to extract at timed exit gates to bank your score
- if you die before extraction, you lose your unbanked score

This is NOT an endless survival score-only game.
It is a salvage-and-extract risk game.

## Core Loop

1. The player spawns in a hazard-filled arena.
2. A large slowly drifting ship debris object appears and moves through the arena.
3. The player earns score ONLY while staying within salvage range of the drifting debris.
4. Hazards escalate over time.
5. Every 30 seconds, an exit gate appears for a short window.
6. If the player reaches the exit gate before it closes, the run ends and the unbanked score is banked as the final score.
7. If the player ignores the gate, the run continues into a harder phase.
8. If the player dies before extracting, all unbanked score is lost.

## Game Identity

The game should feel:
- minimal
- tense
- fast
- clean
- readable
- skill-based
- replayable

The player's decisions should feel like:
- "Can I stay close enough to salvage?"
- "Can I survive long enough to extract?"
- "Do I leave now, or risk another phase for a bigger score?"

## Tech Stack

Use:
- TypeScript
- Phaser 3
- Vite

Allowed additional libraries:
- howler.js for audio only if needed
- no unnecessary libraries

## Platform Requirements

Must support:
Primary Input:
- mobile browser
- touch input

Secondary:
- desktop browser
- pointer input
- keyboard fallback optional

Primary input:
- touch/swipe movement

## Design Constraints

Keep the game small and modular.
Do not overengineer.
Do not introduce backend dependencies for v1.
Use local persistence only for high scores and settings.

## Core Systems Required

The architecture should clearly separate the following concerns:

### Scenes
Scenes should handle flow only:
- BootScene
- MenuScene
- GameScene
- GameOverScene

### Systems
Systems should handle game rules:
- InputSystem
- SalvageSystem
- ExtractionSystem
- BankingSystem
- DifficultySystem
- CollisionSystem
- ScoreSystem
- SaveSystem
- AudioSystem later if needed

### Entities
Entities should handle per-object behavior:
- Player
- SalvageDebris
- DrifterHazard
- BeamHazard
- ExitGate
- optional simple particles/effects later

## Folder Structure

Use this structure unless there is a strong reason not to:

src/
  main.ts
  game/
	config.ts
	constants.ts
	types.ts
	scenes/
  	BootScene.ts
  	MenuScene.ts
  	GameScene.ts
  	GameOverScene.ts
	systems/
  	InputSystem.ts
  	SalvageSystem.ts
  	ExtractionSystem.ts
  	BankingSystem.ts
  	DifficultySystem.ts
  	CollisionSystem.ts
  	ScoreSystem.ts
  	SaveSystem.ts
  	AudioSystem.ts
	entities/
  	Player.ts
  	SalvageDebris.ts
  	DrifterHazard.ts
  	BeamHazard.ts
  	ExitGate.ts
	ui/
  	Hud.ts
  	Overlays.ts
  	Buttons.ts
	data/
  	tuning.ts
  	phaseConfig.ts
  assets/
	audio/
	sprites/
	fonts/

## Architectural Rules

Follow these rules strictly:

1. Scenes manage flow, not gameplay logic.
2. Systems manage gameplay rules.
3. Entities manage local object behavior.
4. Keep tuning values in data files, not scattered magic numbers.
5. Avoid giant god classes.
6. No file should become bloated without a good reason.
7. Use strict TypeScript types where practical.
8. Prefer clarity over cleverness.
9. Keep gameplay code easy to tune.
10. Do not hardcode balancing values inside scene files.

## Visual Direction

The game must have an original minimalist visual identity.

Use:
- geometric shapes or simple stylized vector-like visuals
- readable telegraphs
- restrained effects
- clear separation between hazards, salvage zone, player, and exit gate

Avoid:
- copying the look of Bit Pilot or any other existing game
- cluttered visuals
- unreadable particle spam

Suggested visual tone:
- abstract space salvage
- neon geometry
- synth-tech wreckage
- minimal HUD with 2 to 4 main colors

## Required Mechanics

### Player
- small controllable craft
- smooth pointer-follow or pointer-target movement
- movement constrained to the arena bounds
- fast, responsive, readable movement
- mobile-friendly control feel

### Salvage Debris
- one large drifting wreck object at a time
- drifts slowly through the arena
- has a visible salvage radius
- player earns unbanked score only while inside this radius
- debris is NOT a shield and does NOT protect the player
- debris movement should create positional tension

### Unbanked Score
- gained only while in salvage range
- increases continuously over time
- displayed clearly in HUD
- fully lost if player dies before extraction

### Exit Gate
- appears every 30 seconds
- remains open only for a limited duration
- appears near the edge of the arena
- if the player reaches it in time, the run ends successfully
- extraction banks the unbanked score as final score

### Difficulty
- scales upward each 30-second phase
- can increase hazard frequency, hazard speed, or concurrent hazard pressure
- must remain centralized in a DifficultySystem

### Hazards
At minimum include:
1. drifting obstacles
2. beam-style hazards with readable telegraphing

Hazards must be readable and fair, but increasingly difficult.

## HUD Requirements

HUD should clearly show:
- current unbanked score
- best banked score
- time until next exit gate
- exit gate active state when relevant
- optional phase count

The HUD must remain clean and minimal.

## Recommended Tuning Defaults

Put these in tuning.ts as editable config values:

- player follow speed
- player max speed
- salvage radius
- salvage points per second
- salvage debris drift speed min/max
- extraction phase length = 30 seconds
- exit gate open duration
- hazard spawn rate
- hazard speed scaling per phase
- beam warning duration
- beam active duration

All important tuning should be data-driven.

## Persistence

For v1, save locally:
- best banked score
- audio settings if added
- control settings if added

Do not add cloud save or accounts.

## Performance Requirements

Keep the game lightweight and browser-friendly:
- target smooth 60 FPS where possible
- avoid unnecessary allocations in the main loop
- avoid excessive particles
- keep rendering simple
- support reasonable mobile devices

## Implementation Style

When writing code:
- explain the implementation briefly first
- list the files you will create or change
- then write the code
- then provide a manual test checklist
- then provide assumptions and next follow-up tasks

## Code Quality Rules

- no placeholder nonsense unless clearly marked
- no TODO comments without explaining them
- no half-finished systems hidden in files
- no unnecessary abstractions
- no excessive inheritance trees
- no mixing UI logic and gameplay rules
- no magic numbers in gameplay classes
- no copying branded or copyrighted content

## Manual Testing

For each meaningful feature, include a checklist like:
- game boots successfully
- menu loads
- player follows pointer correctly
- salvage score only accrues inside radius
- exit gate appears at 30 seconds
- extraction banks score
- death clears unbanked score
- difficulty increases after each phase
- restart works instantly

## Phased Build Order

Defer to your judgement for build order but Build in this order unless there is a good reason to change it:

Phase 1:
- project scaffold
- scene structure
- fixed virtual resolution
- player movement
- simple HUD shell

Phase 2:
- salvage debris
- salvage radius
- unbanked score accumulation
- score display

Phase 3:
- one drifting hazard
- collisions
- death
- restart

Phase 4:
- extraction timer
- exit gate spawn
- successful extraction flow
- best score saving

Phase 5:
- beam hazard
- difficulty scaling by phase
- polish and feedback

Phase 6:
- audio
- settings
- additional effects
- browser hardening

## Important Restrictions

Do NOT:
- generate lore or features unrelated to the core loop
- add complex meta-progression for v1
- add networking
- add backend services
- add monetization systems
- add controller support unless asked later
- add procedural content complexity unless needed

## Response Format for Every Task

Whenever I give you a task, respond in this structure:

1. Implementation summary
2. Files to create/change
3. Code
4. Manual test checklist
5. Assumptions / follow-up tasks

## First Task

Start by scaffolding the project structure and core scene setup for:
- BootScene
- MenuScene
- GameScene
- GameOverScene

Also create:
- config.ts
- constants.ts
- types.ts
- tuning.ts

Requirements for the first task:
- fixed virtual resolution
- clean scene registration
- no gameplay yet
- menu should have a simple start action
- code should be organized for the later addition of salvage, hazards, extraction, and score systems


