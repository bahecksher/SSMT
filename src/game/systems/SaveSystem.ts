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
}
