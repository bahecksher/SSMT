import Phaser from 'phaser';
import { PLAYER_RADIUS, EXIT_GATE_HITBOX } from '../data/tuning';
import { submitScore } from '../services/LeaderboardService';
import type { Player } from '../entities/Player';
import type { ExitGate } from '../entities/ExitGate';
import type { ScoreSystem } from './ScoreSystem';
import type { SaveSystem } from './SaveSystem';

export class BankingSystem {
  private player: Player;
  private scoreSystem: ScoreSystem;
  private saveSystem: SaveSystem;

  constructor(player: Player, scoreSystem: ScoreSystem, saveSystem: SaveSystem) {
    this.player = player;
    this.scoreSystem = scoreSystem;
    this.saveSystem = saveSystem;
  }

  /** Returns true if player is inside the extractable gate. Banks the score. */
  checkExtraction(gate: ExitGate | null): boolean {
    if (!gate || !gate.active || !gate.extractable) return false;

    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      gate.x,
      gate.y,
    );

    if (dist < PLAYER_RADIUS + EXIT_GATE_HITBOX) {
      this.scoreSystem.bankScore();
      return true;
    }

    return false;
  }

  /** Save best score and submit to leaderboard. Call after mission bonus is added. */
  finalizeExtraction(): void {
    const banked = this.scoreSystem.getBanked();
    this.saveSystem.saveBestScore(banked);
    const playerName = this.saveSystem.getPlayerName();
    submitScore(playerName, banked);
  }

  destroy(): void {
    // No cleanup needed
  }
}
