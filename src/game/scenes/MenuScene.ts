import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const save = new SaveSystem();
    const best = save.getBestScore();

    this.add.text(centerX, GAME_HEIGHT * 0.22, "SLICK'S", {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: `#${COLORS.PLAYER.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(centerX, GAME_HEIGHT * 0.30, 'SALVAGE & MINING', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(centerX, GAME_HEIGHT * 0.36, 'OPERATION TRAINING MODULE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(centerX, GAME_HEIGHT * 0.45, 'SALVAGE  //  SURVIVE  //  EXTRACT', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 40 },
    }).setOrigin(0.5);

    if (best > 0) {
      this.add.text(centerX, GAME_HEIGHT * 0.52, `BEST: ${Math.floor(best)}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5);
    }

    const tapText = this.add.text(centerX, GAME_HEIGHT * 0.65, 'TAP TO START', {
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

    this.input.once('pointerdown', () => {
      this.scene.start(SCENE_KEYS.GAME);
    });
  }
}
