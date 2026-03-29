import { SAVE_KEY, PLAYER_NAME_KEY } from '../constants';
import { getWalletPayout } from '../data/companyData';
import type { SaveData } from '../types';

const DEFAULT_SAVE: SaveData = { bestScore: 0, walletCredits: 0 };
const LETTER_COUNT = 3;
const DIGIT_COUNT = 3;
const CALLSIGN_SEPARATOR = '-';

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

export class SaveSystem {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        return {
          ...DEFAULT_SAVE,
          ...(JSON.parse(raw) as Partial<SaveData>),
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

  getWalletCredits(): number {
    return this.data.walletCredits;
  }

  saveBestScore(score: number): void {
    if (score > this.data.bestScore) {
      this.data.bestScore = score;
      this.save();
    }
  }

  addWalletCredits(amount: number): void {
    const creditAmount = Math.max(0, Math.floor(amount));
    if (creditAmount <= 0) return;
    this.data.walletCredits += creditAmount;
    this.save();
  }

  spendWalletCredits(amount: number): boolean {
    const debitAmount = Math.max(0, Math.floor(amount));
    if (debitAmount <= 0) return true;
    if (this.data.walletCredits < debitAmount) return false;
    this.data.walletCredits -= debitAmount;
    this.save();
    return true;
  }

  depositWalletPayout(extractedCredits: number): number {
    const payout = getWalletPayout(extractedCredits);
    this.addWalletCredits(payout);
    return payout;
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
