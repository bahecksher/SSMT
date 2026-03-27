import type { PhaseConfig } from '../types';
import {
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
  return {
    phaseNumber: phase,
    hazardSpawnRate: DRIFTER_SPAWN_RATE_BASE * Math.pow(DIFFICULTY_SPAWN_SCALE, phase - 1),
    hazardSpeedMultiplier: 1 + DIFFICULTY_SPEED_SCALE * (phase - 1),
    // Gentler ramp: 6, 10, 15, 21, 28...
    maxConcurrentDrifters: Math.floor(4 + phase * 3 + Math.pow(phase, 1.6)),
    beamEnabled: phase >= 7,
    beamFrequency: phase >= 7 ? Math.max(4000, 8000 - (phase - 7) * 1000) : 0,
    enemyEnabled: phase >= 5,
    enemySpawnRate: phase >= 5 ? Math.max(6000, ENEMY_SPAWN_RATE_BASE - (phase - 5) * 1500) : 0,
    maxConcurrentEnemies: phase >= 5 ? Math.min(1 + Math.floor((phase - 5) * 0.5), 4) : 0,
    npcEnabled: phase >= 2,
    npcSpawnRate: phase >= 2 ? Math.max(8000, NPC_SPAWN_RATE_BASE - (phase - 2) * 2000) : 0,
    maxConcurrentNPCs: phase >= 2 ? Math.min(1 + Math.floor((phase - 1) * 0.5), 3) : 0,
  };
}
