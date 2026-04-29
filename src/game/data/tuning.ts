// Player
export const PLAYER_FOLLOW_SPEED = 0.25;
export const PLAYER_MAX_SPEED = 750;
export const PLAYER_RADIUS = 5;
export const PLAYER_DEAD_ZONE = 8;
export const PLAYER_DISTANCE_SCALE = 3.5;  // velocity = distance * this factor
export const PLAYER_SHIELD_BREAK_INVULN_MS = 500;

// Salvage
export const SALVAGE_RADIUS = 80;
export const SALVAGE_POINTS_PER_SECOND = 10;
export const SALVAGE_DRIFT_SPEED_MIN = 20;
export const SALVAGE_DRIFT_SPEED_MAX = 50;
export const SALVAGE_RESPAWN_DELAY = 1500;

// Extraction
export const PHASE_LENGTH = 30_000;
export const EXIT_GATE_PREVIEW = 15_000; // ms gate is visible but inactive before opening
export const EXIT_GATE_DURATION = 3_000; // ms the gate is extractable
export const EXIT_GATE_RADIUS = 50;      // visual size
export const EXIT_GATE_HITBOX = 20;      // collision radius for extraction
export const EXIT_GATE_INSET = 60;

// Hazards - Drifter
export const DRIFTER_SPEED_BASE = 70;
export const DRIFTER_SPEED_MAX = 200;  // hard cap after bounces
export const DRIFTER_RADIUS = 16;
export const DRIFTER_MINING_RADIUS_MULT = 2.8;  // mining zone = radius * this
export const DRIFTER_MINING_POINTS_MIN = 5;    // pts/sec at outer edge of mining zone
export const DRIFTER_MINING_POINTS_MAX = 30;   // pts/sec when hugging the asteroid body
export const ASTEROID_DESTROY_BONUS = 20;      // pts dropped when asteroid destroyed in collision
export const ASTEROID_DESTROY_DROP_CHANCE = 0; // disabled: small asteroid bonus drops felt too inconsequential
export const DRIFTER_MINEABLE_CHANCE = 0.35;   // share of asteroids that show a mining ring and can be mined
export const DRIFTER_SPAWN_RATE_BASE = 600;

// Hazards - Beam
export const BEAM_WARNING_DURATION = 1_500;
export const BEAM_ACTIVE_DURATION = 800;
export const BEAM_WIDTH = 20;

// Hazards - Enemy
export const ENEMY_SPEED = 120;
export const ENEMY_RADIUS = 12;
export const ENEMY_TURN_RATE = 2.0;  // radians/sec
export const ENEMY_SPAWN_RATE_BASE = 12000; // ms between spawns
export const ENEMY_BONUS_POINTS = 360;

// Health
export const SALVAGE_MAX_HP = 15;         // seconds of salvaging to deplete
export const DRIFTER_MAX_HP = 10;         // seconds of mining to deplete
export const HP_DEPLETED_WARN_TIME = 3000; // ms of flashing before explosion

// NPC Ships (other "players")
export const NPC_SPEED = 90;
export const NPC_RADIUS = 8;
export const NPC_TURN_RATE = 1.8;       // radians/sec
export const NPC_SPAWN_RATE_BASE = 15000; // ms between spawns
export const NPC_SALVAGE_RANGE = 80;     // how close NPC gets before "salvaging"
export const NPC_BUMP_FORCE = 250;       // push speed when player bumps NPC
export const NPC_BUMP_RADIUS = 18;       // collision radius for player bump
export const NPC_BONUS_DROP_CHANCE = 0.4;
export const NPC_BONUS_POINTS = 210;

// Bonus point pickups
export const BONUS_PICKUP_RADIUS = 12;
export const BONUS_PICKUP_LIFETIME = 30000;

// Bomb pickup
export const BOMB_PICKUP_RADIUS = 14;
export const BOMB_PICKUP_LIFETIME = 30000;
export const BOMB_DROP_CHANCE = 0.25;         // 25% chance enemy drops a bomb
export const BOMB_COLLECTION_DELAY = 1500;    // 1.5s before it can be collected
export const BONUS_COLLECTION_DELAY = 1500;   // 1.5s before bonus can be collected

// Versus sabotage laser pickup (versus mode only)
export const VERSUS_LASER_PICKUP_RADIUS = 14;
export const VERSUS_LASER_PICKUP_LIFETIME = 18000;
export const VERSUS_LASER_DROP_CHANCE_ENEMY = 0.08;  // 8% on enemy kill
export const VERSUS_LASER_DROP_CHANCE_NPC = 0.04;    // 4% on NPC kill
export const VERSUS_LASER_COLLECTION_DELAY = 1500;
export const VERSUS_LASER_SEND_COOLDOWN_MS = 5000;   // collector self-rate-limit
export const VERSUS_LASER_WARNING_MS = 1500;         // telegraph window
export const VERSUS_LASER_LETHAL_MS = 500;           // lethal sweep window
export const VERSUS_LASER_WIDTH = 26;
export const VERSUS_LASER_COLOR = 0xc070ff;          // violet, distinct from cyan/red

// Spectator-side disruption inventory. While dead/extracted but peer is still
// playing, the spectator can fire sabotage lasers and pings to mess with them.
export const SPECTATE_LASER_REGEN_MS = 15000;        // 1 charge per 15s
export const SPECTATE_LASER_MAX_CHARGES = 3;
export const SPECTATE_PING_COOLDOWN_MS = 1000;       // 1 ping per second

// Phase 10 boss - Regent gunship
export const GUNSHIP_BOSS_GUN_COUNT = 5;
export const GUNSHIP_BOSS_EDGE_PASS_MIN_MS = 10_000;
export const GUNSHIP_BOSS_EDGE_PASS_MAX_MS = 15_000;
export const GUNSHIP_BOSS_BEAM_WARNING_DURATION = 1_150;
export const GUNSHIP_BOSS_BEAM_ACTIVE_DURATION = 750;
export const GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION = 1_350;
export const GUNSHIP_BOSS_BEAM_STAGGER_MS = 260;
export const GUNSHIP_BOSS_BEAM_WIDTH = 18;
export const GUNSHIP_BOSS_GUN_RADIUS = 18;
export const GUNSHIP_BOSS_CORE_OUTER_RADIUS = 38;
export const GUNSHIP_BOSS_CORE_INNER_RADIUS = 17;
export const GUNSHIP_BOSS_HULL_OFFSET = 34;
export const GUNSHIP_BOSS_BODY_HALF_LENGTH = 188;
export const GUNSHIP_BOSS_BODY_THICKNESS = 42;
export const GUNSHIP_BOSS_DEBRIS_COUNT = 12;

// Difficulty
export const DIFFICULTY_SPEED_SCALE = 0.18;
export const DIFFICULTY_SPAWN_SCALE = 0.75;

// Missions - tier weights (must sum to 1)
export const MISSION_TIER_WEIGHTS = [0.50, 0.35, 0.15] as const;
