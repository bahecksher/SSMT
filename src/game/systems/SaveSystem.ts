import { SAVE_KEY, PLAYER_NAME_KEY } from '../constants';
import type { SaveData } from '../types';

const DEFAULT_SAVE: SaveData = { bestScore: 0 };

function generatePlayerName(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let name = '';
  for (let i = 0; i < 3; i++) {
    name += letters[Math.floor(Math.random() * 26)];
  }
  name += String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return name;
}

function normalizeInitials(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}

function extractDigits(name: string): string {
  const match = name.match(/(\d{4})$/);
  return match?.[1] ?? String(Math.floor(Math.random() * 10000)).padStart(4, '0');
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
        return JSON.parse(raw) as SaveData;
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

  saveBestScore(score: number): void {
    if (score > this.data.bestScore) {
      this.data.bestScore = score;
      this.save();
    }
  }

  getPlayerName(): string {
    try {
      const existing = localStorage.getItem(PLAYER_NAME_KEY);
      if (existing) return existing;
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
    if (normalized.length !== 3) return null;

    const existing = this.getPlayerName();
    const playerName = `${normalized}${extractDigits(existing)}`;
    try {
      localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // Private browsing
    }
    return playerName;
  }
}
