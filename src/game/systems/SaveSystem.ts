import { SAVE_KEY, PLAYER_NAME_KEY } from '../constants';
import { getSlickCut, getWalletPayout } from '../data/companyData';
import {
  CompanyId,
  RunMode,
  isCompanyId,
  type CampaignSessionSave,
  type SaveData,
} from '../types';

const DEFAULT_CAMPAIGN_LIVES = 2;
const DEFAULT_SAVE: SaveData = {
  bestScore: 0,
  selectedMode: RunMode.ARCADE,
  arcadeWalletCredits: 0,
  campaignWalletCredits: 0,
  campaignSession: null,
};
const LETTER_COUNT = 3;
const DIGIT_COUNT = 3;
const CALLSIGN_SEPARATOR = '-';

export interface WalletDepositResult {
  payout: number;
  slickCut: number;
  walletBalance: number;
}

export interface CampaignLifeLossResult {
  gameOver: boolean;
  livesRemaining: number;
  missionsCompleted: number;
}

function randomLetters(count: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let value = '';
  for (let i = 0; i < count; i++) {
    value += letters[Math.floor(Math.random() * 26)];
  }
  return value;
}

function randomDigits(): string {
  return String(Math.floor(Math.random() * (10 ** DIGIT_COUNT))).padStart(DIGIT_COUNT, '0');
}

function generatePlayerName(): string {
  return formatPlayerName(randomLetters(LETTER_COUNT), randomDigits());
}

function normalizeInitials(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, LETTER_COUNT);
}

function extractDigits(name: string): string {
  const digitMatches = name.match(/\d/g);
  if (!digitMatches || digitMatches.length === 0) {
    return randomDigits();
  }
  return digitMatches.join('').slice(-DIGIT_COUNT).padStart(DIGIT_COUNT, '0');
}

function formatPlayerName(initials: string, digits: string): string {
  return `${initials}${CALLSIGN_SEPARATOR}${digits}`;
}

function migratePlayerName(name: string): string {
  const normalizedLetters = normalizeInitials(name);
  const paddedLetters = normalizedLetters + randomLetters(Math.max(0, LETTER_COUNT - normalizedLetters.length));
  return formatPlayerName(paddedLetters, extractDigits(name));
}

function normalizeCampaignSession(value: unknown): CampaignSessionSave | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsed = value as Partial<CampaignSessionSave> & Record<string, unknown>;
  const livesRemaining = typeof parsed.livesRemaining === 'number'
    ? Math.max(0, Math.floor(parsed.livesRemaining))
    : 0;
  const rawFavorIds = Array.isArray(parsed.favorIds) ? parsed.favorIds : [];
  const favorIds = rawFavorIds
    .filter(isCompanyId)
    .slice(0, 2) as CompanyId[];
  const missionsCompleted = typeof parsed.missionsCompleted === 'number'
    ? Math.max(0, Math.floor(parsed.missionsCompleted))
    : 0;

  if (livesRemaining <= 0) {
    return null;
  }

  return {
    livesRemaining,
    favorIds,
    missionsCompleted,
  };
}

export class SaveSystem {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData> & Record<string, unknown>;
        const legacyWalletCredits = typeof parsed.walletCredits === 'number'
          ? Math.max(0, Math.floor(parsed.walletCredits))
          : 0;
        return {
          bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : DEFAULT_SAVE.bestScore,
          selectedMode: parsed.selectedMode === RunMode.ARCADE ? parsed.selectedMode : DEFAULT_SAVE.selectedMode,
          arcadeWalletCredits: typeof parsed.arcadeWalletCredits === 'number'
            ? Math.max(0, Math.floor(parsed.arcadeWalletCredits))
            : legacyWalletCredits,
          campaignWalletCredits: typeof parsed.campaignWalletCredits === 'number'
            ? Math.max(0, Math.floor(parsed.campaignWalletCredits))
            : DEFAULT_SAVE.campaignWalletCredits,
          campaignSession: normalizeCampaignSession(parsed.campaignSession),
        };
      }
    } catch {
      // Private browsing or corrupted data
    }
    return { ...DEFAULT_SAVE };
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Private browsing
    }
  }

  getBestScore(): number {
    return this.data.bestScore;
  }

  getSelectedMode(): RunMode {
    return this.data.selectedMode;
  }

  setSelectedMode(mode: RunMode): void {
    const normalizedMode = mode === RunMode.CAMPAIGN ? RunMode.ARCADE : mode;
    if (this.data.selectedMode === normalizedMode) {
      return;
    }
    this.data.selectedMode = normalizedMode;
    this.save();
  }

  getWalletCredits(mode: RunMode = this.data.selectedMode): number {
    return mode === RunMode.CAMPAIGN
      ? this.data.campaignWalletCredits
      : this.data.arcadeWalletCredits;
  }

  saveBestScore(score: number): void {
    if (score > this.data.bestScore) {
      this.data.bestScore = score;
      this.save();
    }
  }

  addWalletCredits(amount: number, mode: RunMode = this.data.selectedMode): void {
    const creditAmount = Math.max(0, Math.floor(amount));
    if (creditAmount <= 0) return;
    if (mode === RunMode.CAMPAIGN) {
      this.data.campaignWalletCredits += creditAmount;
    } else {
      this.data.arcadeWalletCredits += creditAmount;
    }
    this.save();
  }

  spendWalletCredits(amount: number, mode: RunMode = this.data.selectedMode): boolean {
    const debitAmount = Math.max(0, Math.floor(amount));
    if (debitAmount <= 0) return true;
    const balance = this.getWalletCredits(mode);
    if (balance < debitAmount) return false;
    if (mode === RunMode.CAMPAIGN) {
      this.data.campaignWalletCredits -= debitAmount;
    } else {
      this.data.arcadeWalletCredits -= debitAmount;
    }
    this.save();
    return true;
  }

  depositWalletPayout(extractedCredits: number, mode: RunMode = this.data.selectedMode): WalletDepositResult {
    const bankedCredits = Math.max(0, Math.floor(extractedCredits));
    const payout = getWalletPayout(bankedCredits);
    const slickCut = getSlickCut(bankedCredits);

    if (mode === RunMode.CAMPAIGN) {
      this.data.campaignWalletCredits += payout;
    } else {
      this.data.arcadeWalletCredits += payout;
    }
    this.save();

    return {
      payout,
      slickCut,
      walletBalance: this.getWalletCredits(mode),
    };
  }

  ensureCampaignSession(): CampaignSessionSave {
    if (!this.data.campaignSession) {
      this.data.campaignSession = {
        livesRemaining: DEFAULT_CAMPAIGN_LIVES,
        favorIds: [],
        missionsCompleted: 0,
      };
      this.save();
    }

    return {
      livesRemaining: this.data.campaignSession.livesRemaining,
      favorIds: [...this.data.campaignSession.favorIds],
      missionsCompleted: this.data.campaignSession.missionsCompleted,
    };
  }

  startNewCampaignSession(): CampaignSessionSave {
    this.data.campaignSession = {
      livesRemaining: DEFAULT_CAMPAIGN_LIVES,
      favorIds: [],
      missionsCompleted: 0,
    };
    this.save();
    return this.ensureCampaignSession();
  }

  clearCampaignSession(): void {
    if (!this.data.campaignSession) {
      return;
    }
    this.data.campaignSession = null;
    this.save();
  }

  getCampaignSession(): CampaignSessionSave | null {
    if (!this.data.campaignSession) {
      return null;
    }

    return {
      livesRemaining: this.data.campaignSession.livesRemaining,
      favorIds: [...this.data.campaignSession.favorIds],
      missionsCompleted: this.data.campaignSession.missionsCompleted,
    };
  }

  getCampaignLivesDisplay(): number {
    return this.data.campaignSession?.livesRemaining ?? DEFAULT_CAMPAIGN_LIVES;
  }

  getCampaignMissionsCompletedDisplay(): number {
    return this.data.campaignSession?.missionsCompleted ?? 0;
  }

  setCampaignFavorIds(favorIds: CompanyId[]): CampaignSessionSave {
    const session = this.ensureCampaignSession();
    const normalizedFavorIds = favorIds.filter(isCompanyId).slice(0, 2);
    this.data.campaignSession = {
      livesRemaining: session.livesRemaining,
      favorIds: [...normalizedFavorIds],
      missionsCompleted: session.missionsCompleted,
    };
    this.save();
    return this.ensureCampaignSession();
  }

  addCampaignMissionCompletions(amount: number): CampaignSessionSave {
    const session = this.ensureCampaignSession();
    const completedAmount = Math.max(0, Math.floor(amount));
    if (completedAmount <= 0) {
      return session;
    }

    this.data.campaignSession = {
      ...session,
      missionsCompleted: session.missionsCompleted + completedAmount,
    };
    this.save();
    return this.ensureCampaignSession();
  }

  consumeCampaignLife(): CampaignLifeLossResult {
    const session = this.ensureCampaignSession();
    const livesRemaining = Math.max(0, session.livesRemaining - 1);

    if (livesRemaining <= 0) {
      this.data.campaignSession = null;
      this.save();
      return {
        gameOver: true,
        livesRemaining: 0,
        missionsCompleted: session.missionsCompleted,
      };
    }

    this.data.campaignSession = {
      ...session,
      livesRemaining,
    };
    this.save();

    return {
      gameOver: false,
      livesRemaining,
      missionsCompleted: session.missionsCompleted,
    };
  }

  getPlayerName(): string {
    try {
      const existing = localStorage.getItem(PLAYER_NAME_KEY);
      if (existing) {
        const migrated = migratePlayerName(existing);
        if (migrated !== existing) {
          localStorage.setItem(PLAYER_NAME_KEY, migrated);
        }
        return migrated;
      }
    } catch {
      // Private browsing
    }
    const name = generatePlayerName();
    try {
      localStorage.setItem(PLAYER_NAME_KEY, name);
    } catch {
      // Private browsing
    }
    return name;
  }

  setPlayerInitials(initials: string): string | null {
    const normalized = normalizeInitials(initials);
    if (normalized.length !== LETTER_COUNT) return null;

    const existing = this.getPlayerName();
    const playerName = formatPlayerName(normalized, extractDigits(existing));
    try {
      localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // Private browsing
    }
    return playerName;
  }
}
