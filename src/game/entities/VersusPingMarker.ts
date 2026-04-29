import Phaser from 'phaser';
import { COLORS } from '../constants';

/**
 * Cosmetic pulse marker spawned on the live player's arena when the
 * spectating peer taps a coord. No collision, no lethal effect — just visual
 * noise / fake-warning. Expands and fades over ~1.4 seconds.
 */
export class VersusPingMarker {
  graphic: Phaser.GameObjects.Graphics;
  active = true;
  private elapsed = 0;
  private static readonly LIFETIME_MS = 1400;
  private static readonly MAX_RADIUS = 38;
  private readonly x: number;
  private readonly y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.graphic = scene.add.graphics().setDepth(8);
    this.graphic.setPosition(this.x, this.y);
  }

  update(delta: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    if (this.elapsed >= VersusPingMarker.LIFETIME_MS) {
      this.active = false;
      return;
    }
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    const t = this.elapsed / VersusPingMarker.LIFETIME_MS;
    const r = VersusPingMarker.MAX_RADIUS * t;
    const alpha = 1 - t;
    const color = COLORS.HAZARD;

    g.lineStyle(2, color, 0.85 * alpha);
    g.strokeCircle(0, 0, r);
    g.lineStyle(1, color, 0.55 * alpha);
    g.strokeCircle(0, 0, r * 0.55);
    g.fillStyle(color, 0.18 * alpha);
    g.fillCircle(0, 0, 4);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
