import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../constants';

export class Hud {
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;

  private lastScore = -1;
  private lastBest = -1;
  private lastTimer = '';
  private lastPhase = -1;
  private lastShield = false;

  constructor(scene: Phaser.Scene) {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
    };

    this.scoreText = scene.add.text(16, 16, 'CREDITS: 0', {
      ...textStyle,
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
    }).setDepth(100);

    this.bestText = scene.add.text(GAME_WIDTH - 16, 16, 'BEST: 0', {
      ...textStyle,
      fontSize: '14px',
    }).setOrigin(1, 0).setDepth(100);

    this.timerText = scene.add.text(GAME_WIDTH / 2, 16, 'GATE: --', {
      ...textStyle,
      fontSize: '16px',
    }).setOrigin(0.5, 0).setDepth(100);

    this.phaseText = scene.add.text(GAME_WIDTH / 2, 38, 'PHASE 1', {
      ...textStyle,
      fontSize: '12px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setAlpha(0.5).setDepth(100);

    this.shieldText = scene.add.text(16, 40, '', {
      ...textStyle,
      fontSize: '12px',
      color: '#44aaff',
    }).setDepth(100);
  }

  update(score: number, best: number, gateTimer: string, phase: number = 1, hasShield = false): void {
    const roundedScore = Math.floor(score);
    if (roundedScore !== this.lastScore) {
      this.scoreText.setText(`CREDITS: ${roundedScore}`);
      this.lastScore = roundedScore;
    }

    const roundedBest = Math.floor(best);
    if (roundedBest !== this.lastBest) {
      this.bestText.setText(`BEST: ${roundedBest}`);
      this.lastBest = roundedBest;
    }

    if (gateTimer !== this.lastTimer) {
      this.timerText.setText(gateTimer);
      this.lastTimer = gateTimer;

      const gateColor = gateTimer === 'GATE OPEN'
        ? `#${COLORS.GATE.toString(16).padStart(6, '0')}`
        : `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
      this.timerText.setColor(gateColor);
    }

    if (phase !== this.lastPhase) {
      this.phaseText.setText(`PHASE ${phase}`);
      this.lastPhase = phase;
    }

    if (hasShield !== this.lastShield) {
      this.shieldText.setText(hasShield ? 'SHIELD' : '');
      this.lastShield = hasShield;
    }
  }

  destroy(): void {
    this.scoreText.destroy();
    this.bestText.destroy();
    this.timerText.destroy();
    this.phaseText.destroy();
    this.shieldText.destroy();
  }
}
