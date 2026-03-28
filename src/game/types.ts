export interface SaveData {
  bestScore: number;
}

export interface PhaseConfig {
  phaseNumber: number;
  hazardSpawnRate: number;
  hazardSpeedMultiplier: number;
  maxConcurrentDrifters: number;
  beamEnabled: boolean;
  beamFrequency: number;
  beamBurstCount: number;
  beamBurstDelay: number;
  beamWidth: number;
  enemyEnabled: boolean;
  enemySpawnRate: number;
  maxConcurrentEnemies: number;
  npcEnabled: boolean;
  npcSpawnRate: number;
  maxConcurrentNPCs: number;
}

export const GameState = {
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  RESULTS: 'RESULTS',
  EXTRACTING: 'EXTRACTING',
  DEATH_FREEZE: 'DEATH_FREEZE',
  DEAD: 'DEAD',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];
