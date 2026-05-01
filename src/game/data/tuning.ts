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
export const VERSUS_LASER_WARNING_MS = 900;          // telegraph window
export const VERSUS_LASER_LETHAL_MS = 500;           // lethal sweep window
export const VERSUS_LASER_WIDTH = 36;
export const VERSUS_LASER_COLOR = 0xc070ff;          // violet, distinct from cyan/red

// Spectator-side disruption inventory. While dead/extracted but peer is still
// playing, the spectator can fire sabotage lasers and repulsor charges to mess
// with them.
export const SPECTATE_LASER_REGEN_MS = 7000;         // 1 charge per 7s
export const SPECTATE_LASER_MAX_CHARGES = 3;
export const SPECTATE_REPULSOR_COOLDOWN_MS = 2500;
export const SPECTATE_REPULSOR_ARM_MS = 1200;
export const SPECTATE_REPULSOR_BLAST_MS = 420;
export const SPECTATE_REPULSOR_RADIUS = 72;
export const SPECTATE_REPULSOR_PLAYER_FORCE = 520;
export const SPECTATE_REPULSOR_OBJECT_FORCE = 260;

// Cross-arena beam throttle during a boss fight. Phase 10 beam config is harsh; the
// boss already provides plenty of pressure, so the regular beams should fire less.
export const BOSS_BEAM_FREQUENCY_MULT = 2.2;
export const BOSS_BEAM_BURST_COUNT = 1;
export const BOSS_DRIFTER_SPAWN_RATE_MULT = 2.0;

// Phase 10 boss spawn weights (must sum to 1)
export const BOSS_SPAWN_WEIGHT_GUNSHIP = 0.25;
export const BOSS_SPAWN_WEIGHT_HAULER = 0.25;
export const BOSS_SPAWN_WEIGHT_SINGULARITY = 0.25;
export const BOSS_SPAWN_WEIGHT_LATTICE = 0.25;
export const BOSS_SHIELD_DRIFT_SPAWN_INTERVAL_MIN_MS = 12_000;
export const BOSS_SHIELD_DRIFT_SPAWN_INTERVAL_MAX_MS = 17_000;
export const BOSS_SHIELD_DRIFT_SPEED_MIN = 180;
export const BOSS_SHIELD_DRIFT_SPEED_MAX = 250;
export const BOSS_DEFEAT_BONUS_POINTS = 2_500;
export const BOSS_DEFEAT_BONUS_PICKUP_COUNT = 12;
export const POST_BOSS_EXTRACT_DELAY_MS = 15_000;
export const POST_BOSS_ESCAPE_GATE_DURATION_MS = 22_000;
export const POST_BOSS_COLLAPSE_DURATION_MS = 22_000;
export const POST_BOSS_BEAM_FREQUENCY_MULT = 3.0;
export const POST_BOSS_BEAM_BURST_COUNT = 1;
export const POST_BOSS_ENEMY_SURGE_INITIAL_COUNT = 10;
export const POST_BOSS_ENEMY_SURGE_INTERVAL_MS = 900;
export const POST_BOSS_ENEMY_SURGE_MAX_ENEMIES = 18;

// Wormhole pocket
export const WORMHOLE_MIN_PHASE = 5;
export const WORMHOLE_MAX_PHASE = 9;
export const WORMHOLE_DROP_CHANCE_RARE_SALVAGE = 0.03;
export const WORMHOLE_PICKUP_RADIUS = 16;
export const WORMHOLE_PICKUP_LIFETIME = 18_000;
export const WORMHOLE_SCHEDULED_RUN_CHANCE = 0.45;
export const WORMHOLE_EVENT_SPAWN_DELAY_MS = 5_000;
export const WORMHOLE_EVENT_PREVIEW_MS = 6_000;
export const WORMHOLE_EVENT_ACTIVE_MS = 9_000;
export const WORMHOLE_POCKET_DURATION_MS = 45_000;
export const WORMHOLE_POCKET_SALVAGE_MULT = 2.5;
export const WORMHOLE_POCKET_DRIFTER_CAP_MULT = 4.5;
export const WORMHOLE_POCKET_SPAWN_RATE_MULT = 0.22;
export const WORMHOLE_POCKET_SPEED_MULT = 2.25;
export const WORMHOLE_POCKET_COMPACT_DRIFTER_CAP_MULT = 2.8;
export const WORMHOLE_POCKET_TINY_DRIFTER_CAP_MULT = 2.25;
export const WORMHOLE_POCKET_COMPACT_SPAWN_RATE_MULT = 0.34;
export const WORMHOLE_POCKET_TINY_SPAWN_RATE_MULT = 0.42;
export const WORMHOLE_POCKET_COMPACT_SPEED_MULT = 1.72;
export const WORMHOLE_POCKET_TINY_SPEED_MULT = 1.48;
export const WORMHOLE_POCKET_COMPACT_MAX_SIZE = 3.2;
export const WORMHOLE_POCKET_TINY_MAX_SIZE = 2.2;
export const WORMHOLE_POCKET_MINEABLE_CHANCE = 1.0;
export const WORMHOLE_POCKET_RARE_SALVAGE_INTERVAL_MS = 2_200;
export const WORMHOLE_POCKET_BONUS_INTERVAL_MS = 1_450;
export const WORMHOLE_POCKET_BONUS_POINTS = 360;
export const WORMHOLE_POCKET_BOUNDARY_END_RADIUS_MULT = 0.24;
export const WORMHOLE_POCKET_BOUNDARY_BURN_MS = 650;
export const WORMHOLE_POCKET_GATE_CYCLE_MS = 15_000;
export const WORMHOLE_POCKET_GATE_PREVIEW_MS = 10_000;
export const WORMHOLE_POCKET_GATE_DURATION_MS = 3_000;
export const WORMHOLE_POCKET_SIZE_POOL = [
  [0.9, 3],
  [1.4, 4],
  [2.2, 4],
  [3.2, 3],
  [4.5, 2],
] as const;

// Phase 10 boss - Slag Hauler (asteroid mothership)
export const SLAG_HAULER_SEGMENT_COUNT = 4;
export const SLAG_HAULER_BODY_SPEED = 66;
export const SLAG_HAULER_BODY_HALF_LENGTH = 168;
export const SLAG_HAULER_BODY_THICKNESS = 56;
export const SLAG_HAULER_SEGMENT_RADIUS = 22;
export const SLAG_HAULER_CORE_OUTER_RADIUS = 40;
export const SLAG_HAULER_CORE_INNER_RADIUS = 17;
export const SLAG_HAULER_VENT_INTERVAL_MIN_MS = 1400;
export const SLAG_HAULER_VENT_INTERVAL_MAX_MS = 2400;
export const SLAG_HAULER_VENT_CHARGE_MS = 700;
export const SLAG_HAULER_VENT_SPEED_MIN = 90;
export const SLAG_HAULER_VENT_SPEED_MAX = 180;
export const SLAG_HAULER_VENT_SIZE_MIN = 1.2;
export const SLAG_HAULER_VENT_SIZE_MAX = 2.0;
export const SLAG_HAULER_DEBRIS_COUNT = 14;

// Phase 10 boss - Singularity (gravity well)
export const SINGULARITY_BODY_RADIUS = 30;
export const SINGULARITY_DRIFT_SPEED = 110;
export const SINGULARITY_WARNING_MS = 2_000;
export const SINGULARITY_PULL_MS = 4_200;
export const SINGULARITY_REPULSE_MS = 700;
export const SINGULARITY_VULNERABLE_MS = 5_500;
export const SINGULARITY_PULL_RADIUS = 480;
export const SINGULARITY_PULL_ACCEL = 380;          // px/s^2 at edge of pull radius
export const SINGULARITY_REPULSE_ACCEL = 850;        // px/s^2 outward during repulse window
export const SINGULARITY_REPULSE_RADIUS = 600;
export const SINGULARITY_HARDPOINT_COUNT = 4;
export const SINGULARITY_HARDPOINT_RADIUS = 16;
export const SINGULARITY_HARDPOINT_ORBIT_RADIUS = 78;
export const SINGULARITY_HARDPOINT_SPIN_SPEED = 0.45; // rad/s
export const SINGULARITY_CORE_OUTER_RADIUS = 40;
export const SINGULARITY_CORE_INNER_RADIUS = 17;
export const SINGULARITY_DEBRIS_COUNT = 14;

// Phase 10 boss - Beam Lattice (stationary central pylon, rotating sweep beams)
export const BEAM_LATTICE_BODY_RADIUS = 36;
export const BEAM_LATTICE_HARDPOINT_COUNT = 4;
export const BEAM_LATTICE_HARDPOINT_RADIUS = 16;
export const BEAM_LATTICE_HARDPOINT_ORBIT_RADIUS = 50;
export const BEAM_LATTICE_ROTATION_SPEED = 0.55;     // rad/s
export const BEAM_LATTICE_VIEW_OVERSHOOT = 48;       // beam tip extends past view edge
export const BEAM_LATTICE_BEAM_WIDTH = 16;
export const BEAM_LATTICE_FIRE_MS = 8_000;
export const BEAM_LATTICE_COOLDOWN_MS = 10_000;
export const BEAM_LATTICE_CHARGE_TELEGRAPH_MS = 1_100;
export const BEAM_LATTICE_DANGER_INNER = 70;         // inside beam emitter ring
export const BEAM_LATTICE_DANGER_OUTER = 320;        // out to beam tip
export const BEAM_LATTICE_SALVAGE_MULTIPLIER = 2.5;
export const BEAM_LATTICE_CORE_OUTER_RADIUS = 38;
export const BEAM_LATTICE_CORE_INNER_RADIUS = 17;
export const BEAM_LATTICE_DEBRIS_COUNT = 12;

// Phase 10 boss - Regent gunship
export const GUNSHIP_BOSS_GUN_COUNT = 5;
export const GUNSHIP_BOSS_BODY_SPEED = 84;
export const GUNSHIP_BOSS_BEAM_WARNING_DURATION = 1_150;
export const GUNSHIP_BOSS_BEAM_ACTIVE_DURATION = 750;
export const GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION = 2_400;
export const GUNSHIP_BOSS_BEAM_STAGGER_MS = 260;
export const GUNSHIP_BOSS_BEAM_WIDTH = 18;
export const GUNSHIP_BOSS_GUN_RADIUS = 18;
export const GUNSHIP_BOSS_CORE_OUTER_RADIUS = 38;
export const GUNSHIP_BOSS_CORE_INNER_RADIUS = 17;
export const GUNSHIP_BOSS_BODY_HALF_LENGTH = 188;
export const GUNSHIP_BOSS_BODY_THICKNESS = 42;
export const GUNSHIP_BOSS_DEBRIS_COUNT = 12;

// Difficulty
export const DIFFICULTY_SPEED_SCALE = 0.18;
export const DIFFICULTY_SPAWN_SCALE = 0.75;

// Missions - tier weights (must sum to 1)
export const MISSION_TIER_WEIGHTS = [0.50, 0.35, 0.15] as const;
