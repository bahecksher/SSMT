import Phaser from 'phaser';
import { getLayout } from '../layout';
import { getSettings } from '../systems/SettingsSystem';

export class HologramOverlay {
  private scanlines: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const layout = getLayout();
    this.scanlines = scene.add.graphics().setDepth(100);
    this.scanlines.lineStyle(1, 0x000000, 0.08);
    for (let y = 0; y < layout.gameHeight; y += 3) {
      this.scanlines.lineBetween(0, y, layout.gameWidth, y);
    }
    this.scanlines.setVisible(getSettings().scanlines);
  }

  setEnabled(enabled: boolean): void {
    this.scanlines.setVisible(enabled);
  }

  update(_delta: number): void {}

  destroy(): void {
    this.scanlines.destroy();
  }
}
