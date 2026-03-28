import type { PhaseConfig } from '../types';
import {
  BEAM_WIDTH,
  DRIFTER_SPAWN_RATE_BASE,
  DIFFICULTY_SPEED_SCALE,
  DIFFICULTY_SPAWN_SCALE,
  ENEMY_SPAWN_RATE_BASE,
  NPC_SPAWN_RATE_BASE,
} from './tuning';

// Size variation per phase: [radiusScale, weight] pairs
// Higher phases get more large asteroids mixed in
const SIZE_POOLS: Record<number, [number, number][]> = {
  1: [[1, 3], [1.5, 2], [2, 1]],                                    // normal + some big
  2: [[0.8, 2], [1.5, 3], [2.2, 2], [3, 1]],                       // mixed, big present
  3: [[0.7, 1], [1.5, 2], [2.5, 3], [3.5, 2], [4.5, 1]],          // lots of huge
  4: [[0.7, 1], [1.5, 1], [2.5, 2], [3.8, 3], [5, 2]],            // massive boulders
  5: [[0.7, 1], [2, 1], [3.5, 3], [5, 3], [6, 2]],                // screen-filling giants
};

function getSizePool(phase: number): [number, number][] {
  const maxKey = Math.max(...Object.keys(SIZE_POOLS).map(Number));
  return SIZE_POOLS[Math.min(phase, maxKey)];
}

export function pickAsteroidSize(phase: number): number {
  const pool = getSizePool(phase);
  const totalWeight = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * totalWeight;
  for (const [scale, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return scale;
  }
  return 1;
}

export function getPhaseConfig(phase: number): PhaseConfig {
  // Drifter count ramps phases 1-4, then caps once beams/enemies take over
  const rawDrifterCap = Math.floor(4 + phase * 3 + Math.pow(phase, 1.6));
  const drifterCap = phase >= 5 ? Math.min(rawDrifterCap, 22) : rawDrifterCap;

  return {
    phaseNumber: phase,
    // Spawn rate plateaus at phase 4 level — difficulty shifts to lethality, not quantity
    hazardSpawnRate: DRIFTER_SPAWN_RATE_BASE * Math.pow(DIFFICULTY_SPAWN_SCALE, Math.min(phase - 1, 3)),
    hazardSpeedMultiplier: 1 + DIFFICULTY_SPEED_SCALE * (phase - 1),
    maxConcurrentDrifters: drifterCap,
    beamEnabled: phase >= 5,
    beamFrequency: phase >= 5 ? Math.max(2500, 10000 - (phase - 5) * 1000) : 0,
    beamBurstCount: phase >= 8 ? Math.min(2 + Math.floor((phase - 8) * 0.5), 5) : 2,
    beamBurstDelay: phase >= 8 ? Math.max(200, 500 - (phase - 8) * 50) : 0,
    // Aggressive width curve: 20 → 28 → 40 → 56 → 76 → 100 (ph5–10+)
    beamWidth: phase >= 5 ? Math.min(BEAM_WIDTH * Math.pow(1.4, phase - 5), 120) : BEAM_WIDTH,
    enemyEnabled: phase >= 5,
    enemySpawnRate: phase >= 5 ? Math.max(4000, ENEMY_SPAWN_RATE_BASE - (phase - 5) * 1500) : 0,
    maxConcurrentEnemies: phase >= 5 ? Math.min(1 + Math.floor((phase - 5) * 0.5), phase >= 8 ? 6 : 4) : 0,
    npcEnabled: phase >= 1,
    npcSpawnRate: Math.max(8000, NPC_SPAWN_RATE_BASE - Math.max(0, phase - 1) * 2000),
    maxConcurrentNPCs: Math.min(1 + Math.floor(phase * 0.5), 3),
  };
}
