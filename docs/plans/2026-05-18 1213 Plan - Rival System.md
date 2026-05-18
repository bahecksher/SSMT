# Plan - Rival System
_Created: 2026-05-18 1213_

## Goal
Add a named rival system that turns selected NPC ships into memorable company-backed antagonists with unique silhouettes, comms, reputations, and asymmetric abilities the player cannot equip. Rivals should create short, scary duels inside the existing arena loop without becoming full boss fights.

## Approach

### 1. Design boundaries
- Treat rivals as elite NPC encounters, not regular NPC replacements.
- Keep the regular NPC salvage-competitor role intact.
- Spawn at most one active rival at a time.
- Keep rival tuning data-driven: spawn phases, HP, shield layers, flee threshold, cooldowns, projectile/field strength, and company weights should live in data/tuning structures rather than scattered constants.
- Keep rivals out of Versus initially unless a later plan explicitly adds them to multiplayer.
- Do not make rivals drop below 1 HP. If an incoming hit would kill a rival, trigger its flee state instead.
- Fleeing rivals should become non-scoring escape events unless a later decision adds pursuit rewards.

### 2. Technical shape
- Add a `RivalDef` data model with:
  - `id`, `name`, `callsign`, `companyId`, `repLabel`
  - visual color/accent and ship icon variant
  - max HP / shield layers
  - ability type and ability tuning
  - spawn phase range and encounter weight
  - comm line groups: intro, ability tell, low-hp flee, escaped, rematch
- Add a `RivalShip` entity or extend the NPC ship family only if the inheritance stays clean. Preferred shape is a separate class because rivals attack the player directly while normal NPCs hunt salvage.
- Add a `RivalSystem` owned by `GameScene` or `DifficultySystem`. Start in `DifficultySystem` if it needs phase/spawn coordination; keep ability collision and player effects near existing player collision code if that avoids leaking player state into the system.
- Add compact comm presentation using the existing `CommPanel` / liaison patterns rather than inventing a new UI surface.
- Add minimap/mirror snapshot support only after solo behavior is stable.

### 3. Core behavior
- Rival states:
  - `enter`: spawns from an edge with an intro comm and obvious scan/lock visual.
  - `hunt`: aggressively steers toward the player, preferring attack angles over salvage.
  - `cast`: telegraphs and fires its unique ability.
  - `recover`: short post-ability vulnerability window.
  - `flee`: triggers at 1 HP or would-be lethal hit; boosts toward nearest edge/gate and stops attacking.
  - `escaped`: removed from arena, optional comm sting.
- Rivals should feel ferocious, but readable:
  - Every lethal or high-force ability needs a clear tell.
  - Abilities should affect asteroids/salvage when useful so the arena tells the story physically.
  - Rival ship icon, comm speaker, and ability color should match their company.

### 4. First rival roster
- **Veyra Kade // IRONVEIL SEC // "The Redline"**
  - Ability: attached forward laser.
  - Combat role: direct duelist who tries to line up the player and sweep a narrow beam.
  - Story hook: Kade's deniable enforcement ace sent to scare Slick's pilot off protected claims.
  - Comms:
    - Intro: "Pilot, you are trespassing on Ironveil recovery rights."
    - Ability tell: "Redline armed. Hold still."
    - Flee: "Enough. I have your flight pattern."

- **Brann Ochoa // IRONVEIL SEC // "Bulwark"**
  - Ability: short-range repulse burst adapted from the Versus repulsor concept.
  - Combat role: rams close, waits for the player near asteroid clusters, then fires a strong outward blast.
  - Story hook: corporate riot-control captain testing arena denial tech on unaffiliated pilots.
  - Comms:
    - Intro: "I do not chase. I contain."
    - Ability tell: "Brace."
    - Flee: "Containment failed. Logging cause."

- **Mira Sable // IRONVEIL SEC // "Triple Lock"**
  - Ability: two or three shield layers.
  - Combat role: relentless pressure ship that requires repeated shield rams or carefully timed hazard manipulation.
  - Story hook: Ironveil public champion, sent when subtle threats fail.
  - Comms:
    - Intro: "Slick keeps putting soft pilots in hard lanes."
    - Shield break: "Layer down. Two left."
    - Flee: "Contract says capture telemetry, not die for it."

- **Dr. Pell Arcturus // RECLAIM CO // "Gravemark"**
  - Ability: deploys destroyable black-hole bombs derived from the Singularity boss language.
  - Combat role: area denial rival who makes the map unstable until the player destroys the bomb.
  - Story hook: Reclaim scientist claiming the player is contaminating recoverable wreck fields.
  - Comms:
    - Intro: "Nothing is lost. It is only poorly owned."
    - Ability tell: "Marking mass center."
    - Flee: "Your survival is statistically rude."

### 5. Additional rival candidates
- **Juno Vale // FREEPORT UNION // "Sideband"**
  - Ability: false pickups or comm static decoys that briefly hide hazard tells.
  - Why it fits: Freeport is scrappy and signal-oriented rather than brute-force military.
- **Kell Mora // DEEPCORE MINING // "Boreline"**
  - Ability: deploys mining charges that crack asteroids into fast debris fields.
  - Why it fits: Deepcore pressure should reshape the arena and make mining greed dangerous.
- **Nyla-adjacent Freeport rogue // FREEPORT UNION**
  - Ability: steals or magnetizes salvage, forcing chase decisions.
  - Why it fits: good non-lethal rival if the story needs moral ambiguity instead of only assassins.

### 6. Story integration
- Rivals should escalate from company reputation and campaign progress:
  - Low rep: rivals are rumors or one-off scan pings.
  - Mid rep: first named rival enters after a phase threshold.
  - High rep or repeated company wins: rematches and more personal comms.
- Ironveil should own the majority of early rivals because their existing identity maps to enforcement, security, and intimidation.
- Other companies should field rivals only when their motive is clear:
  - Deepcore protects mining claims and industrial secrets.
  - Reclaim protects salvage rights and experimental recovery tech.
  - Freeport rivals should feel personal, competitive, or rogue rather than corporate death squads.
- Rival comms should reveal why they are after the player:
  - The player is costing companies money.
  - Slick is using the player to break restricted claims.
  - The player's arena results are changing company leaderboards and contract leverage.
  - Some rivals respect the player and retreat because they want a rematch, not a martyrdom.

### 7. Implementation phases
1. Data pass: define `RivalDef` roster, ability type union, tuning defaults, and comm line groups.
2. Entity pass: implement one non-lethal prototype rival with HP, flee-at-1 behavior, company-colored ship icon, and intro/flee comms.
3. Ability pass: add Redline laser first because existing beam/laser language gives the cleanest prototype.
4. Encounter pass: wire spawn rules into solo phase progression and make sure rivals do not overlap with phase-10 boss pressure.
5. Roster pass: add repulse, layered shield, and black-hole bomb variants one at a time.
6. Story pass: add per-rival comms, rematch memory, company motive copy, and Mission Select hints.
7. Verification pass: add focused build/smoke checks, then expand Playwright harness only if stable test hooks are needed.

## Scope boundaries
- No implementation in this planning pass.
- No story overhaul yet; this plan prepares hooks the overhaul can use.
- No Versus rival behavior in the first implementation.
- No new save schema until the design decides whether rival rematch memory persists.
- No broad NPC refactor unless the first implementation proves shared behavior is becoming brittle.
- No boss replacement; rivals should coexist with the boss ladder but not compete with phase-10 boss identity.

## Open questions
- Should rivals appear in Quick Play, Campaign only, or both with different spawn rules?
- Should escaping rivals grant any reward, bounty, or reputation change, or should reward wait until a later rematch system?
- Should rival encounters be tied to the player's highest company rep, current accepted contract company, or a separate heat meter?
- Should Ironveil rivals sometimes punish high Ironveil rep as internal hazing, or only low/opposing rep as enforcement?
- Should black-hole bombs be destroyable by shield ram only, normal contact, laser-like tools, or asteroid impacts?
- Should rival comm portraits reuse liaison-style geometric portraits or get new ship-icon-only panels first?
