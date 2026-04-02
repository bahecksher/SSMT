import Phaser from 'phaser';
import { COLORS } from '../constants';
import { BONUS_PICKUP_LIFETIME, BONUS_PICKUP_RADIUS, BONUS_COLLECTION_DELAY } from '../data/tuning';

export class BonusPickup {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = BONUS_PICKUP_RADIUS;
  active = true;
  readonly points: number;
  readonly miningBonus: boolean;

  private pulse = 0;
  private life = BONUS_PICKUP_LIFETIME;
  private collectionDelay: number;

  constructor(scene: Phaser.Scene, x: number, y: number, points: number, vx = 0, vy = 0, collectionDelay = BONUS_COLLECTION_DELAY, miningBonus = false) {
    this.x = x;
    this.y = y;
    this.points = points;
    this.vx = vx;
    this.vy = vy;
    this.collectionDelay = collectionDelay;
    this.miningBonus = miningBonus;
    this.graphic = scene.add.graphics().setDepth(8);
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  /** Returns true when the pickup can be collected. */
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
    this.pulse += delta * 0.006;
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    const collectable = this.isCollectable();
    let alpha = collectable ? 1 : 0.35 + Math.sin(this.pulse * 8) * 0.15;
    // Blink for last 5 seconds before expiring
    if (this.life < 5000) {
      const blinkRate = this.life < 2500 ? 0.12 : 0.06;
      alpha = Math.sin(this.life * blinkRate) > 0 ? alpha : 0.15;
    }
    g.setAlpha(alpha);

    const glow = 0.25 + Math.sin(this.pulse) * 0.12;
    const ringRadius = this.radius + 4 + Math.sin(this.pulse * 1.3) * 2;

    if (this.miningBonus) {
      // Mining bonus — orange asteroid-chunk icon
      const miningColor = 0xffaa00;
      g.lineStyle(1, miningColor, glow * 0.6);
      g.strokeCircle(0, 0, this.radius * 2.2);
      g.fillStyle(miningColor, 0.15);
      g.fillCircle(0, 0, this.radius);

      // Small asteroid shape (irregular pentagon)
      const r = this.radius * 0.8;
      g.lineStyle(1.5, miningColor, 0.95);
      g.fillStyle(miningColor, 0.4);
      g.beginPath();
      g.moveTo(r * 0.3, -r);
      g.lineTo(r, -r * 0.2);
      g.lineTo(r * 0.7, r * 0.8);
      g.lineTo(-r * 0.5, r * 0.6);
      g.lineTo(-r * 0.9, -r * 0.4);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Pickaxe accent — small diagonal line
      g.lineStyle(1.5, 0xffffff, 0.6);
      g.lineBetween(-3, 3, 3, -3);

      g.lineStyle(1, miningColor, glow + 0.2);
      g.strokeCircle(0, 0, ringRadius);
    } else {
      // Standard credit bonus — yellow diamond
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
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
