/**
 * MISSION TEMPLATES — edit this file to tune missions.
 *
 * Each entry defines one mission type with 3 difficulty tiers.
 * - type: must match a MissionType key
 * - company: which company issues this mission (DEEPCORE, RECLAIM, IRONVEIL, FREEPORT)
 * - weight: how often this mission appears (higher = more common)
 * - labelTemplate: display text — {target} is replaced with the tier's target number
 * - tiers: [tier1, tier2, tier3] — each has a target (goal) and reward (bonus credits)
 */

export const MISSION_TEMPLATES = [
  // --- RECLAIM CO (salvage) ---
  {
    type: 'SALVAGE_CREDITS' as const,
    company: 'RECLAIM' as const,
    weight: 4,
    labelTemplate: 'SALVAGE {target} CREDITS',
    tiers: [
      { target: 500, reward: 300 },
      { target: 1000, reward: 500 },
      { target: 4000, reward: 1000 },
    ] as const,
  },
  {
    type: 'EXTRACT_CREDITS' as const,
    company: 'RECLAIM' as const,
    weight: 3,
    labelTemplate: 'EXTRACT WITH {target} CREDITS',
    tiers: [
      { target: 500, reward: 300 },
      { target: 1000, reward: 500 },
      { target: 4000, reward: 1000 },
    ] as const,
  },

  // --- DEEPCORE MINING ---
  {
    type: 'MINING_CREDITS' as const,
    company: 'DEEPCORE' as const,
    weight: 4,
    labelTemplate: 'MINE {target} CREDITS',
    tiers: [
      { target: 500, reward: 1000 },
      { target: 1000, reward: 1500 },
      { target: 3000, reward: 2000 },
    ] as const,
  },
  {
    type: 'BREAK_ASTEROIDS' as const,
    company: 'DEEPCORE' as const,
    weight: 2,
    labelTemplate: 'BREAK {target} ASTEROIDS',
    tiers: [
      { target: 3, reward: 500 },
      { target: 6, reward: 1000 },
      { target: 10, reward: 2000 },
    ] as const,
  },

  // --- IRONVEIL SEC (combat) ---
  {
    type: 'DESTROY_ENEMIES' as const,
    company: 'IRONVEIL' as const,
    weight: 1,
    labelTemplate: 'DESTROY {target} ENEMIES',
    tiers: [
      { target: 3, reward: 1000 },
      { target: 6, reward: 3000 },
      { target: 9, reward: 5000 },
    ] as const,
  },
  {
    type: 'DESTROY_NPCS' as const,
    company: 'IRONVEIL' as const,
    weight: 1,
    labelTemplate: 'ELIMINATE {target} RIVAL MINERS',
    tiers: [
      { target: 3, reward: 500 },
      { target: 6, reward: 1000 },
      { target: 9, reward: 2000 },
    ] as const,
  },

  // --- FREEPORT UNION (survival / misc) ---
  {
    type: 'SURVIVE_EXTRACT' as const,
    company: 'FREEPORT' as const,
    weight: 2,
    labelTemplate: 'SURVIVE {target} PHASES & EXTRACT',
    tiers: [
      { target: 5, reward: 1000 },
      { target: 7, reward: 2000 },
      { target: 10, reward: 3000 },
    ] as const,
  },
  {
    type: 'NO_DAMAGE_PHASE' as const,
    company: 'FREEPORT' as const,
    weight: 1,
    labelTemplate: '{target} FLAWLESS PHASES',
    tiers: [
      { target: 2, reward: 500 },
      { target: 4, reward: 1000 },
      { target: 6, reward: 3000 },
    ] as const,
  },
  {
    type: 'COLLECT_SHIELDS' as const,
    company: 'FREEPORT' as const,
    weight: 1,
    labelTemplate: 'COLLECT {target} SHIELDS',
    tiers: [
      { target: 5, reward: 500 },
      { target: 10, reward: 1000 },
      { target: 15, reward: 1500 },
    ] as const,
  },
];
