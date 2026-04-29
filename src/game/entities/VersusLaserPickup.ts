import Phaser from 'phaser';
import {
  VERSUS_LASER_PICKUP_RADIUS,
  VERSUS_LASER_PICKUP_LIFETIME,
  VERSUS_LASER_COLLECTION_DELAY,
  VERSUS_LASER_COLOR,
} from '../data/tuning';

export class VersusLaserPickup {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = VERSUS_LASER_PICKUP_RADIUS;
  active = true;

  private pulse = 0;
  private life = VERSUS_LASER_PICKUP_LIFETIME;
  private collectionDelay = VERSUS_LASER_COLLECTION_DELAY;

  constructor(scene: Phaser.Scene, x: number, y: number, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.graphic = scene.add.graphics().setDepth(9);
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  isCollectable(): boolean {
    return this.collectionDelay <= 0;
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    this.life -= delta;
    if (this.collectionDelay > 0) {
      this.collectionDelay -= delta;
    }
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.pulse += delta * 0.005;
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    const collectable = this.isCollectable();
    let masterAlpha = collectable ? 1 : 0.35 + Math.sin(this.pulse * 8) * 0.15;
    if (this.life < 5000) {
      const blinkRate = this.life < 2500 ? 0.12 : 0.06;
      masterAlpha = Math.sin(this.life * blinkRate) > 0 ? masterAlpha : 0.15;
    }
    g.setAlpha(masterAlpha);

    const glow = 0.25 + Math.sin(this.pulse) * 0.12;
    const ringRadius = this.radius + 5 + Math.sin(this.pulse * 1.3) * 3;
    const color = VERSUS_LASER_COLOR;

    // Outer glow ring
    g.lineStyle(1, color, glow * 0.6);
    g.strokeCircle(0, 0, this.radius * 2.5);

    // Filled circle body
    g.fillStyle(color, 0.18);
    g.fillCircle(0, 0, this.radius);

    // Diamond outline — visually distinct from bomb's circle+fuse
    g.lineStyle(1.5, color, 0.95);
    g.beginPath();
    g.moveTo(0, -this.radius);
    g.lineTo(this.radius, 0);
    g.lineTo(0, this.radius);
    g.lineTo(-this.radius, 0);
    g.closePath();
    g.strokePath();

    // Horizontal beam glyph through center
    g.lineStyle(1.5, 0xffffff, 0.7);
    g.lineBetween(-this.radius * 0.7, 0, this.radius * 0.7, 0);

    // Center spark (pulsing)
    const sparkAlpha = 0.5 + Math.sin(this.pulse * 6) * 0.5;
    g.fillStyle(0xffffff, sparkAlpha);
    g.fillCircle(0, 0, 2);

    // Pulsing outer ring
    g.lineStyle(1, color, glow + 0.2);
    g.strokeCircle(0, 0, ringRadius);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
