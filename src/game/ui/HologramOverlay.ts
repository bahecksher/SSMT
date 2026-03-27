import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class HologramOverlay {
  private scanlines: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scanlines = scene.add.graphics().setDepth(100);
    this.scanlines.lineStyle(1, 0x000000, 0.08);
    for (let y = 0; y < GAME_HEIGHT; y += 3) {
      this.scanlines.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  update(_delta: number): void {}

  destroy(): void {
    this.scanlines.destroy();
  }
}
