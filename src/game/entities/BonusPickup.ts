import Phaser from 'phaser';
import { COLORS } from '../constants';
import { BONUS_PICKUP_LIFETIME, BONUS_PICKUP_RADIUS } from '../data/tuning';

export class BonusPickup {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = BONUS_PICKUP_RADIUS;
  active = true;
  readonly points: number;

  private pulse = 0;
  private life = BONUS_PICKUP_LIFETIME;

  constructor(scene: Phaser.Scene, x: number, y: number, points: number, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.points = points;
    this.vx = vx;
    this.vy = vy;
    this.graphic = scene.add.graphics().setDepth(8);
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    this.life -= delta;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.988;
    this.vy *= 0.988;
    this.pulse += delta * 0.006;
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    if (Math.random() < 0.03) {
      g.setAlpha(0.45);
    } else {
      g.setAlpha(1);
    }

    const glow = 0.25 + Math.sin(this.pulse) * 0.12;
    const ringRadius = this.radius + 4 + Math.sin(this.pulse * 1.3) * 2;

    g.lineStyle(1, COLORS.SALVAGE, glow * 0.6);
    g.strokeCircle(0, 0, this.radius * 2.2);
    g.fillStyle(0xffdd55, 0.12);
    g.fillCircle(0, 0, this.radius);

    g.lineStyle(1.5, 0xffdd55, 0.95);
    g.beginPath();
    g.moveTo(0, -this.radius);
    g.lineTo(this.radius * 0.7, 0);
    g.lineTo(0, this.radius);
    g.lineTo(-this.radius * 0.7, 0);
    g.closePath();
    g.strokePath();

    g.lineStyle(1, 0xffffff, 0.55);
    g.lineBetween(-4, 0, 4, 0);
    g.lineBetween(0, -4, 0, 4);

    g.lineStyle(1, 0xffdd55, glow + 0.2);
    g.strokeCircle(0, 0, ringRadius);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
