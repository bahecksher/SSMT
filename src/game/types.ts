export interface SaveData {
  bestScore: number;
  selectedMode: RunMode;
  arcadeWalletCredits: number;
  campaignWalletCredits: number;
  campaignSession: CampaignSessionSave | null;
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
  bossEnabled: boolean;
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

export const RunMode = {
  ARCADE: 'ARCADE',
  CAMPAIGN: 'CAMPAIGN',
} as const;

export type RunMode = (typeof RunMode)[keyof typeof RunMode];

export function isRunMode(value: unknown): value is RunMode {
  return value === RunMode.ARCADE || value === RunMode.CAMPAIGN;
}

// --- Company Reputation ---

export const CompanyId = {
  DEEPCORE: 'DEEPCORE',
  RECLAIM: 'RECLAIM',
  IRONVEIL: 'IRONVEIL',
  FREEPORT: 'FREEPORT',
} as const;
export type CompanyId = (typeof CompanyId)[keyof typeof CompanyId];

export function isCompanyId(value: unknown): value is CompanyId {
  return value === CompanyId.DEEPCORE
    || value === CompanyId.RECLAIM
    || value === CompanyId.IRONVEIL
    || value === CompanyId.FREEPORT;
}

export interface CampaignSessionSave {
  livesRemaining: number;
  favorIds: CompanyId[];
  missionsCompleted: number;
}

// --- Mission System ---

export const MissionType = {
  BREAK_ASTEROIDS: 'BREAK_ASTEROIDS',
  EXTRACT_CREDITS: 'EXTRACT_CREDITS',
  DESTROY_NPCS: 'DESTROY_NPCS',
  DESTROY_ENEMIES: 'DESTROY_ENEMIES',
  MINING_CREDITS: 'MINING_CREDITS',
  SALVAGE_CREDITS: 'SALVAGE_CREDITS',
  SURVIVE_EXTRACT: 'SURVIVE_EXTRACT',
  NO_DAMAGE_PHASE: 'NO_DAMAGE_PHASE',
  COLLECT_SHIELDS: 'COLLECT_SHIELDS',
} as const;
export type MissionType = (typeof MissionType)[keyof typeof MissionType];

export function isMissionType(value: unknown): value is MissionType {
  return value === MissionType.BREAK_ASTEROIDS
    || value === MissionType.EXTRACT_CREDITS
    || value === MissionType.DESTROY_NPCS
    || value === MissionType.DESTROY_ENEMIES
    || value === MissionType.MINING_CREDITS
    || value === MissionType.SALVAGE_CREDITS
    || value === MissionType.SURVIVE_EXTRACT
    || value === MissionType.NO_DAMAGE_PHASE
    || value === MissionType.COLLECT_SHIELDS;
}

export interface CompanyRepSave {
  rep: Record<CompanyId, number>;
}

export interface RunBoosts {
  miningYieldMult: number;     // default 1.0
  salvageYieldMult: number;    // default 1.0
  npcBonusMult: number;        // default 1.0
  bonusDropChanceAdd: number;  // default 0.0
}

export interface CompanyFavorOffer {
  companyId: CompanyId;
  level: number;
  label: string;
  boostValue: string;
  cost: number;
}

export interface MissionDef {
  type: MissionType;
  company: CompanyId;
  target: number;
  label: string;
  reward: number;
  tier: 1 | 2 | 3;
}

export interface ActiveMission {
  id: string;
  def: MissionDef;
  progress: number;
  completed: boolean;
  accepted: boolean;
}

export interface MissionSaveData {
  activeMissions: ActiveMission[];
  completedLifetime: number;
  rerollsRemaining: number;
}
