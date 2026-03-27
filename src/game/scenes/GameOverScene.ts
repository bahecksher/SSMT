import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';

interface GameOverData {
  score: number;
  cause: 'death' | 'extract';
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create(data: GameOverData): void {
    const centerX = GAME_WIDTH / 2;
    const cause = data.cause ?? 'death';
    const score = data.score ?? 0;
    const save = new SaveSystem();
    const best = save.getBestScore();

    const isDeath = cause === 'death';
    const titleColor = isDeath ? COLORS.HAZARD : COLORS.GATE;
    const titleText = isDeath ? 'DESTROYED' : 'EXTRACTED';

    this.add.text(centerX, GAME_HEIGHT * 0.25, titleText, {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: `#${titleColor.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);

    if (!isDeath) {
      this.add.text(centerX, GAME_HEIGHT * 0.37, `SCORE: ${Math.floor(score)}`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5);
    } else {
      this.add.text(centerX, GAME_HEIGHT * 0.37, 'SCORE LOST', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5);
    }

    if (best > 0) {
      this.add.text(centerX, GAME_HEIGHT * 0.48, `BEST: ${Math.floor(best)}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5);
    }

    const tapText = this.add.text(centerX, GAME_HEIGHT * 0.65, 'TAP TO RETRY', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add.text(centerX, GAME_HEIGHT * 0.75, 'MENU', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start(SCENE_KEYS.MENU);
      });

    // Delay input so accidental taps don't skip the screen
    this.time.delayedCall(500, () => {
      this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
        if (targets.length === 0) {
          this.scene.start(SCENE_KEYS.GAME);
        }
      });
    });

  }
}
