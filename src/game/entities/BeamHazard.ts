import Phaser from 'phaser';
import { COLORS } from '../constants';
import { BEAM_WARNING_DURATION, BEAM_ACTIVE_DURATION } from '../data/tuning';
import { getLayout } from '../layout';

export class BeamHazard {
  graphic: Phaser.GameObjects.Graphics;
  active = true;
  private lethal = false;
  private elapsed = 0;
  private totalDuration: number;
  readonly width: number;

  // Line segment endpoints
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly isHorizontal: boolean;

  constructor(scene: Phaser.Scene, width = 20) {
    this.width = width;
    const layout = getLayout();
    // Randomly choose horizontal or vertical
    this.isHorizontal = Math.random() < 0.5;

    if (this.isHorizontal) {
      const y = Phaser.Math.Between(80, layout.gameHeight - 80);
      this.x1 = 0;
      this.y1 = y;
      this.x2 = layout.gameWidth;
      this.y2 = y;
    } else {
      const x = Phaser.Math.Between(40, layout.gameWidth - 40);
      this.x1 = x;
      this.y1 = 0;
      this.x2 = x;
      this.y2 = layout.gameHeight;
    }

    this.totalDuration = BEAM_WARNING_DURATION + BEAM_ACTIVE_DURATION;
    this.graphic = scene.add.graphics().setDepth(6);
  }

  update(delta: number): void {
    if (!this.active) return;

    this.elapsed += delta;

    if (this.elapsed >= this.totalDuration) {
      this.active = false;
      return;
    }

    this.lethal = this.elapsed >= BEAM_WARNING_DURATION;
    this.draw();
  }

  isLethal(): boolean {
    return this.lethal;
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    const beamColor = COLORS.ENEMY;

    if (!this.lethal) {
      // Warning phase: thin flickering line
      const warningProgress = this.elapsed / BEAM_WARNING_DURATION;
      const flicker = Math.sin(this.elapsed * 0.03) * 0.3 + 0.3;
      const alpha = flicker * (0.3 + warningProgress * 0.4);

      g.lineStyle(2, beamColor, alpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);

      // Growing width indicator
      const growWidth = this.width * warningProgress * 0.5;
      g.lineStyle(growWidth, beamColor, alpha * 0.2);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);
    } else {
      // Active phase: thick bright lethal beam
      const activeProgress = (this.elapsed - BEAM_WARNING_DURATION) / BEAM_ACTIVE_DURATION;
      const fadeAlpha = activeProgress > 0.7 ? 1 - (activeProgress - 0.7) / 0.3 : 1;

      // Glow
      g.lineStyle(this.width * 2, beamColor, 0.15 * fadeAlpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);

      // Core beam
      g.lineStyle(this.width, beamColor, 0.9 * fadeAlpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);

      // Bright center
      g.lineStyle(this.width * 0.3, 0xffffff, 0.7 * fadeAlpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);
    }
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
