import { SAVE_KEY } from '../constants';
import type { SaveData } from '../types';

const DEFAULT_SAVE: SaveData = { bestScore: 0 };

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
}
