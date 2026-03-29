import { CompanyId } from '../types';
import type { CompanyFavorOffer, CompanyRepSave, RunBoosts } from '../types';
import { COMPANY_REP_KEY } from '../constants';

export interface CompanyDef {
  id: CompanyId;
  name: string;
  color: number;
  accent: number;
  liaison: string;
  liaisonTitle: string;
  boostLabel: string;
}

export interface RepStanding {
  level: number;
  label: string;
  nextRepRequired: number | null;
  progressToNext: number;
}

export const COMPANIES: Record<CompanyId, CompanyDef> = {
  [CompanyId.DEEPCORE]: {
    id: CompanyId.DEEPCORE,
    name: 'DEEPCORE MINING',
    color: 0xffaa22,
    accent: 0xcc8800,
    liaison: 'HOLT',
    liaisonTitle: 'HOLT // DEEPCORE',
    boostLabel: 'MINING YIELD',
  },
  [CompanyId.RECLAIM]: {
    id: CompanyId.RECLAIM,
    name: 'RECLAIM CO',
    color: 0xff00ff,
    accent: 0xcc00cc,
    liaison: 'VOSS',
    liaisonTitle: 'VOSS // RECLAIM',
    boostLabel: 'SALVAGE YIELD',
  },
  [CompanyId.IRONVEIL]: {
    id: CompanyId.IRONVEIL,
    name: 'IRONVEIL SEC',
    color: 0xff3366,
    accent: 0xff0044,
    liaison: 'KADE',
    liaisonTitle: 'KADE // IRONVEIL',
    boostLabel: 'NPC BOUNTY',
  },
  [CompanyId.FREEPORT]: {
    id: CompanyId.FREEPORT,
    name: 'FREEPORT UNION',
    color: 0x44ccff,
    accent: 0x2299cc,
    liaison: 'NYLA',
    liaisonTitle: 'NYLA // FREEPORT',
    boostLabel: 'DROP RATE',
  },
};

export const COMPANY_IDS = [
  CompanyId.DEEPCORE,
  CompanyId.RECLAIM,
  CompanyId.IRONVEIL,
  CompanyId.FREEPORT,
] as const;

const PLAYER_WALLET_SHARE = 0.60;
const PLAYER_WALLET_SHARE_PERCENT = Math.round(PLAYER_WALLET_SHARE * 100);
const SLICK_CUT_PERCENT = 100 - PLAYER_WALLET_SHARE_PERCENT;

// --- Reputation thresholds ---

export const REP_THRESHOLDS = [
  { level: 0, label: 'UNKNOWN', repRequired: 0 },
  { level: 1, label: 'KNOWN', repRequired: 3 },
  { level: 2, label: 'TRUSTED', repRequired: 8 },
  { level: 3, label: 'ELITE', repRequired: 16 },
] as const;

/** Rep awarded per mission tier: tier 1 = 1, tier 2 = 2, tier 3 = 4 */
export const REP_PER_TIER: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 4 };

// --- Boost multipliers per rep level (index 0 = level 0, etc.) ---

const DEEPCORE_MINING_MULT = [1.0, 1.15, 1.30, 1.50];
const RECLAIM_SALVAGE_MULT = [1.0, 1.15, 1.30, 1.50];
const IRONVEIL_NPC_MULT    = [1.0, 1.50, 2.00, 3.00];
const FREEPORT_DROP_ADD    = [0.0, 0.10, 0.20, 0.30];
const DEEPCORE_FAVOR_COST  = [0, 8000, 18000, 32000];
const RECLAIM_FAVOR_COST   = [0, 8000, 18000, 32000];
const IRONVEIL_FAVOR_COST  = [0, 9000, 20000, 36000];
const FREEPORT_FAVOR_COST  = [0, 7500, 16500, 29000];

// --- Helpers ---

export function getRepLevel(rep: number): number {
  for (let i = REP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rep >= REP_THRESHOLDS[i].repRequired) return REP_THRESHOLDS[i].level;
  }
  return 0;
}

export function getRepStanding(rep: number): RepStanding {
  const level = getRepLevel(rep);
  const current = REP_THRESHOLDS[level];
  const next = REP_THRESHOLDS[level + 1];
  if (!next) {
    return {
      level,
      label: current.label,
      nextRepRequired: null,
      progressToNext: 1,
    };
  }

  const span = Math.max(1, next.repRequired - current.repRequired);
  const progress = Math.min(1, Math.max(0, (rep - current.repRequired) / span));
  return {
    level,
    label: current.label,
    nextRepRequired: next.repRequired,
    progressToNext: progress,
  };
}

export function loadCompanyRep(): CompanyRepSave {
  try {
    const raw = localStorage.getItem(COMPANY_REP_KEY);
    if (raw) return JSON.parse(raw) as CompanyRepSave;
  } catch { /* corrupted or private browsing */ }
  return {
    rep: {
      [CompanyId.DEEPCORE]: 0,
      [CompanyId.RECLAIM]: 0,
      [CompanyId.IRONVEIL]: 0,
      [CompanyId.FREEPORT]: 0,
    },
  };
}

export function saveCompanyRep(data: CompanyRepSave): void {
  try {
    localStorage.setItem(COMPANY_REP_KEY, JSON.stringify(data));
  } catch { /* private browsing */ }
}

function createNeutralRunBoosts(): RunBoosts {
  return {
    miningYieldMult: 1.0,
    salvageYieldMult: 1.0,
    npcBonusMult: 1.0,
    bonusDropChanceAdd: 0.0,
  };
}

export function getWalletPayout(extractedCredits: number): number {
  return Math.max(0, Math.floor(Math.max(0, extractedCredits) * PLAYER_WALLET_SHARE));
}

export function getSlickCut(extractedCredits: number): number {
  return Math.max(0, extractedCredits - getWalletPayout(extractedCredits));
}

export function getWalletSharePercent(): number {
  return PLAYER_WALLET_SHARE_PERCENT;
}

export function getSlickCutPercent(): number {
  return SLICK_CUT_PERCENT;
}

export function getFavorOffer(companyId: CompanyId, repSave: CompanyRepSave): CompanyFavorOffer | null {
  const level = getRepLevel(repSave.rep[companyId] ?? 0);
  if (level <= 0) return null;

  return {
    companyId,
    level,
    label: COMPANIES[companyId].boostLabel,
    boostValue: formatBoost(companyId, level),
    cost: getFavorCost(companyId, level),
  };
}

export function computeRunBoostsFromFavors(selectedCompanies: CompanyId[], repSave: CompanyRepSave): RunBoosts {
  const boosts = createNeutralRunBoosts();

  for (const companyId of selectedCompanies) {
    const level = getRepLevel(repSave.rep[companyId] ?? 0);
    if (level <= 0) continue;
    applyCompanyBoost(boosts, companyId, level);
  }

  return boosts;
}

/** Format a boost value for display, e.g. "x1.30" or "+20%" */
function formatBoost(companyId: CompanyId, level: number): string {
  switch (companyId) {
    case CompanyId.DEEPCORE: return `x${DEEPCORE_MINING_MULT[level].toFixed(2)}`;
    case CompanyId.RECLAIM: return `x${RECLAIM_SALVAGE_MULT[level].toFixed(2)}`;
    case CompanyId.IRONVEIL: return `x${IRONVEIL_NPC_MULT[level].toFixed(1)}`;
    case CompanyId.FREEPORT: return `+${Math.round(FREEPORT_DROP_ADD[level] * 100)}%`;
  }
}

function getFavorCost(companyId: CompanyId, level: number): number {
  switch (companyId) {
    case CompanyId.DEEPCORE: return DEEPCORE_FAVOR_COST[level];
    case CompanyId.RECLAIM: return RECLAIM_FAVOR_COST[level];
    case CompanyId.IRONVEIL: return IRONVEIL_FAVOR_COST[level];
    case CompanyId.FREEPORT: return FREEPORT_FAVOR_COST[level];
  }
}

function applyCompanyBoost(boosts: RunBoosts, companyId: CompanyId, level: number): void {
  switch (companyId) {
    case CompanyId.DEEPCORE:
      boosts.miningYieldMult = DEEPCORE_MINING_MULT[level];
      break;
    case CompanyId.RECLAIM:
      boosts.salvageYieldMult = RECLAIM_SALVAGE_MULT[level];
      break;
    case CompanyId.IRONVEIL:
      boosts.npcBonusMult = IRONVEIL_NPC_MULT[level];
      break;
    case CompanyId.FREEPORT:
      boosts.bonusDropChanceAdd = FREEPORT_DROP_ADD[level];
      break;
  }
}
