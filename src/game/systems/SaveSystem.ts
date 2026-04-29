import { SAVE_KEY, PLAYER_NAME_KEY } from '../constants';
import { getSlickCut, getWalletPayout } from '../data/companyData';
import {
  RunMode,
  isRunMode,
  type CampaignSessionSave,
  type LocalCampaignLeaderboardEntry,
  type SaveData,
} from '../types';

const DEFAULT_CAMPAIGN_LIVES = 2;
const MAX_CAMPAIGN_LEADERBOARD_ENTRIES = 10;

// Bump when SaveData shape changes. Add a step to `migrateSave` for each bump.
const CURRENT_SAVE_VERSION = 1;

interface SaveEnvelope {
  v: number;
  data: Partial<SaveData> & Record<string, unknown>;
}

function isSaveEnvelope(value: unknown): value is SaveEnvelope {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { v?: unknown }).v === 'number'
    && typeof (value as { data?: unknown }).data === 'object'
    && (value as { data: unknown }).data !== null;
}
const DEFAULT_SAVE: SaveData = {
  bestScore: 0,
  campaignBestScore: 0,
  selectedMode: RunMode.ARCADE,
  arcadeWalletCredits: 0,
  campaignWalletCredits: 0,
  campaignSession: null,
  campaignLeaderboard: [],
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
  const missionsCompleted = typeof parsed.missionsCompleted === 'number'
    ? Math.max(0, Math.floor(parsed.missionsCompleted))
    : 0;
  const totalExtracted = typeof parsed.totalExtracted === 'number'
    ? Math.max(0, Math.floor(parsed.totalExtracted))
    : 0;

  if (livesRemaining <= 0) {
    return null;
  }

  return {
    livesRemaining,
    missionsCompleted,
    totalExtracted,
  };
}

function normalizeV1(parsed: Partial<SaveData> & Record<string, unknown>): SaveData {
  const legacyWalletCredits = typeof parsed.walletCredits === 'number'
    ? Math.max(0, Math.floor(parsed.walletCredits))
    : 0;
  const campaignLeaderboard = normalizeCampaignLeaderboard(parsed.campaignLeaderboard);
  const derivedCampaignBest = campaignLeaderboard[0]?.score ?? 0;
  return {
    bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : DEFAULT_SAVE.bestScore,
    campaignBestScore: typeof parsed.campaignBestScore === 'number'
      ? Math.max(derivedCampaignBest, Math.max(0, Math.floor(parsed.campaignBestScore)))
      : derivedCampaignBest,
    selectedMode: isRunMode(parsed.selectedMode) ? parsed.selectedMode : DEFAULT_SAVE.selectedMode,
    arcadeWalletCredits: typeof parsed.arcadeWalletCredits === 'number'
      ? Math.max(0, Math.floor(parsed.arcadeWalletCredits))
      : legacyWalletCredits,
    campaignWalletCredits: typeof parsed.campaignWalletCredits === 'number'
      ? Math.max(0, Math.floor(parsed.campaignWalletCredits))
      : DEFAULT_SAVE.campaignWalletCredits,
    campaignSession: normalizeCampaignSession(parsed.campaignSession),
    campaignLeaderboard,
  };
}

function migrateSave(envelope: SaveEnvelope): SaveData {
  // Step ladder: bump `data` shape one version at a time.
  // Currently every prior version is shape-compatible with v1, so normalizeV1 covers all.
  // Future bumps: add `if (v < N) { data = migrateNMinus1ToN(data); }` blocks here.
  const data = envelope.data;
  return normalizeV1(data);
}

function normalizeCampaignLeaderboard(value: unknown): LocalCampaignLeaderboardEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: LocalCampaignLeaderboardEntry[] = [];
  for (const rawEntry of value) {
    if (!rawEntry || typeof rawEntry !== 'object') {
      continue;
    }

    const parsed = rawEntry as Partial<LocalCampaignLeaderboardEntry> & Record<string, unknown>;
    const playerName = typeof parsed.playerName === 'string' ? parsed.playerName.trim() : '';
    const score = typeof parsed.score === 'number' ? Math.max(0, Math.floor(parsed.score)) : -1;
    const missionsCompleted = typeof parsed.missionsCompleted === 'number'
      ? Math.max(0, Math.floor(parsed.missionsCompleted))
      : 0;
    const createdAt = typeof parsed.createdAt === 'string' && parsed.createdAt.length > 0
      ? parsed.createdAt
      : new Date(0).toISOString();

    if (!playerName || score < 0) {
      continue;
    }

    entries.push({
      playerName,
      score,
      missionsCompleted,
      createdAt,
    });
  }

  return entries
    .sort((a, b) => b.score - a.score || b.missionsCompleted - a.missionsCompleted || b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_CAMPAIGN_LEADERBOARD_ENTRIES);
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
        const parsed = JSON.parse(raw) as unknown;
        const envelope: SaveEnvelope = isSaveEnvelope(parsed)
          ? parsed
          : { v: 0, data: (parsed ?? {}) as SaveEnvelope['data'] };
        return migrateSave(envelope);
      }
    } catch {
      // Private browsing or corrupted data
    }
    return { ...DEFAULT_SAVE };
  }

  private save(): void {
    try {
      const envelope: SaveEnvelope = {
        v: CURRENT_SAVE_VERSION,
        data: this.data as unknown as SaveEnvelope['data'],
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
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

  getCampaignBestScore(): number {
    return this.data.campaignBestScore;
  }

  setSelectedMode(mode: RunMode): void {
    if (this.data.selectedMode === mode) {
      return;
    }
    this.data.selectedMode = mode;
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

  getCampaignLeaderboard(limit = MAX_CAMPAIGN_LEADERBOARD_ENTRIES): LocalCampaignLeaderboardEntry[] {
    const normalizedLimit = Math.max(0, Math.floor(limit));
    return this.data.campaignLeaderboard.slice(0, normalizedLimit).map((entry) => ({ ...entry }));
  }

  recordCampaignLeaderboardEntry(score: number, missionsCompleted: number): LocalCampaignLeaderboardEntry | null {
    const totalScore = Math.max(0, Math.floor(score));
    const entry: LocalCampaignLeaderboardEntry = {
      playerName: this.getPlayerName(),
      score: totalScore,
      missionsCompleted: Math.max(0, Math.floor(missionsCompleted)),
      createdAt: new Date().toISOString(),
    };

    this.data.campaignBestScore = Math.max(this.data.campaignBestScore, totalScore);
    this.data.campaignLeaderboard = [...this.data.campaignLeaderboard, entry]
      .sort((a, b) => b.score - a.score || b.missionsCompleted - a.missionsCompleted || b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_CAMPAIGN_LEADERBOARD_ENTRIES);
    this.save();

    return { ...entry };
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
        missionsCompleted: 0,
        totalExtracted: 0,
      };
      this.save();
    }

    return { ...this.data.campaignSession };
  }

  startNewCampaignSession(): CampaignSessionSave {
    this.data.campaignSession = {
      livesRemaining: DEFAULT_CAMPAIGN_LIVES,
      missionsCompleted: 0,
      totalExtracted: 0,
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

    return { ...this.data.campaignSession };
  }

  getCampaignLivesDisplay(): number {
    return this.data.campaignSession?.livesRemaining ?? DEFAULT_CAMPAIGN_LIVES;
  }

  addCampaignLives(amount: number): CampaignSessionSave {
    const session = this.ensureCampaignSession();
    const extraLives = Math.max(0, Math.floor(amount));
    if (extraLives <= 0) {
      return session;
    }

    this.data.campaignSession = {
      ...session,
      livesRemaining: session.livesRemaining + extraLives,
    };
    this.save();
    return this.ensureCampaignSession();
  }

  getCampaignMissionsCompletedDisplay(): number {
    return this.data.campaignSession?.missionsCompleted ?? 0;
  }

  getCampaignTotalExtractedDisplay(): number {
    return this.data.campaignSession?.totalExtracted ?? 0;
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

  addCampaignExtractedCredits(amount: number): CampaignSessionSave {
    const session = this.ensureCampaignSession();
    const credits = Math.max(0, Math.floor(amount));
    if (credits <= 0) {
      return session;
    }

    this.data.campaignSession = {
      ...session,
      totalExtracted: session.totalExtracted + credits,
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
