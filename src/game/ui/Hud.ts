import Phaser from 'phaser';
import { COLORS } from '../constants';
import { getLayout } from '../layout';

export class Hud {
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;

  private lastScore = -1;
  private lastBest = -1;
  private lastPhase = -1;
  private lastShield = false;

  constructor(scene: Phaser.Scene) {
    const layout = getLayout();
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
    };

    this.scoreText = scene.add.text(16, 16, 'CREDITS: 0', {
      ...textStyle,
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
    }).setDepth(100);

    this.bestText = scene.add.text(layout.gameWidth - 16, 16, 'BEST: 0', {
      ...textStyle,
    }).setOrigin(1, 0).setDepth(100);

    this.phaseText = scene.add.text(layout.centerX, 16, 'PHASE 1', {
      ...textStyle,
      fontSize: '12px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setAlpha(0.5).setDepth(100);

    this.shieldText = scene.add.text(16, 34, '', {
      ...textStyle,
      fontSize: '12px',
      color: '#44aaff',
    }).setDepth(100);
  }

  update(score: number, best: number, phase: number = 1, hasShield = false): void {
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
    this.phaseText.destroy();
    this.shieldText.destroy();
  }
}
