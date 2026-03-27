// Player
export const PLAYER_FOLLOW_SPEED = 0.25;
export const PLAYER_MAX_SPEED = 750;
export const PLAYER_RADIUS = 5;
export const PLAYER_DEAD_ZONE = 8;
export const PLAYER_DISTANCE_SCALE = 3.5;  // velocity = distance * this factor

// Salvage
export const SALVAGE_RADIUS = 120;
export const SALVAGE_POINTS_PER_SECOND = 10;
export const SALVAGE_POINTS_MIN = 2;
export const SALVAGE_POINTS_MAX = 12;
export const SALVAGE_DRIFT_SPEED_MIN = 20;
export const SALVAGE_DRIFT_SPEED_MAX = 50;
export const SALVAGE_RESPAWN_DELAY = 1500;

// Extraction
export const PHASE_LENGTH = 30_000;
export const EXIT_GATE_DURATION = 5_000;
export const EXIT_GATE_RADIUS = 50;      // visual size
export const EXIT_GATE_HITBOX = 20;      // collision radius for extraction
export const EXIT_GATE_GRACE_DELAY = 2000; // ms before gate becomes extractable
export const EXIT_GATE_INSET = 60;

// Hazards - Drifter
export const DRIFTER_SPEED_BASE = 70;
export const DRIFTER_SPEED_MAX = 200;  // hard cap after bounces
export const DRIFTER_RADIUS = 16;
export const DRIFTER_MINING_RADIUS_MULT = 3.5;  // mining zone = radius * this
export const DRIFTER_MINING_POINTS_MIN = 1;    // pts/sec at outer edge of mining zone
export const DRIFTER_MINING_POINTS_MAX = 15;   // pts/sec when hugging the asteroid body
export const DRIFTER_SPAWN_RATE_BASE = 600;

// Salvage collision
export const SALVAGE_KILL_RADIUS = 18;  // physical body kill zone

// Hazards - Beam
export const BEAM_WARNING_DURATION = 1_500;
export const BEAM_ACTIVE_DURATION = 800;
export const BEAM_WIDTH = 20;

// Hazards - Enemy
export const ENEMY_SPEED = 120;
export const ENEMY_RADIUS = 12;
export const ENEMY_TURN_RATE = 2.0;  // radians/sec
export const ENEMY_SPAWN_RATE_BASE = 12000; // ms between spawns
export const ENEMY_BONUS_POINTS = 120;

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
export const NPC_BONUS_POINTS = 70;

// Bonus point pickups
export const BONUS_PICKUP_RADIUS = 12;
export const BONUS_PICKUP_LIFETIME = 9000;

// Difficulty
export const DIFFICULTY_SPEED_SCALE = 0.18;
export const DIFFICULTY_SPAWN_SCALE = 0.75;
