import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  SPECTATE_REPULSOR_ARM_MS,
  SPECTATE_REPULSOR_BLAST_MS,
  SPECTATE_REPULSOR_RADIUS,
  VERSUS_LASER_COLOR,
} from '../data/tuning';

export class VersusRepulsorCharge {
  graphic: Phaser.GameObjects.Graphics;
  active = true;
  detonated = false;
  private elapsed = 0;
  readonly x: number;
  readonly y: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    this.x = x;
    this.y = y;
    this.graphic = scene.add.graphics().setDepth(8);
    this.graphic.setPosition(this.x, this.y);
  }

  update(delta: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    if (!this.detonated && this.elapsed >= SPECTATE_REPULSOR_ARM_MS) {
      this.detonated = true;
    }
    if (this.elapsed >= SPECTATE_REPULSOR_ARM_MS + SPECTATE_REPULSOR_BLAST_MS) {
      this.active = false;
      return;
    }
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    if (!this.detonated) {
      const t = Phaser.Math.Clamp(this.elapsed / SPECTATE_REPULSOR_ARM_MS, 0, 1);
      const radius = SPECTATE_REPULSOR_RADIUS * (0.35 + t * 0.65);
      const pulse = 0.5 + Math.sin(this.elapsed * 0.018) * 0.5;
      g.lineStyle(2, VERSUS_LASER_COLOR, 0.42 + pulse * 0.25);
      g.strokeCircle(0, 0, radius);
      g.lineStyle(1, 0xffffff, 0.18 + pulse * 0.16);
      g.strokeCircle(0, 0, radius * 0.52);
      g.fillStyle(VERSUS_LASER_COLOR, 0.12 + pulse * 0.05);
      g.fillCircle(0, 0, 5 + t * 4);
      return;
    }

    const t = Phaser.Math.Clamp((this.elapsed - SPECTATE_REPULSOR_ARM_MS) / SPECTATE_REPULSOR_BLAST_MS, 0, 1);
    const alpha = 1 - t;
    const radius = SPECTATE_REPULSOR_RADIUS * (0.65 + t * 0.55);
    g.fillStyle(VERSUS_LASER_COLOR, 0.12 * alpha);
    g.fillCircle(0, 0, radius);
    g.lineStyle(3, VERSUS_LASER_COLOR, 0.8 * alpha);
    g.strokeCircle(0, 0, radius);
    g.lineStyle(1.5, COLORS.SHIELD, 0.52 * alpha);
    g.strokeCircle(0, 0, radius * 0.62);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
