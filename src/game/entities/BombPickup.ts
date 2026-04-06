import Phaser from 'phaser';
import { COLORS } from '../constants';
import { BOMB_PICKUP_RADIUS, BOMB_PICKUP_LIFETIME, BOMB_COLLECTION_DELAY } from '../data/tuning';

export class BombPickup {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = BOMB_PICKUP_RADIUS;
  active = true;

  private pulse = 0;
  private life = BOMB_PICKUP_LIFETIME;
  private collectionDelay = BOMB_COLLECTION_DELAY;

  constructor(scene: Phaser.Scene, x: number, y: number, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.graphic = scene.add.graphics().setDepth(9);
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  /** Returns true when the pickup can be collected by the player. */
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
    // Blink for last 5 seconds before expiring
    if (this.life < 5000) {
      const blinkRate = this.life < 2500 ? 0.12 : 0.06;
      masterAlpha = Math.sin(this.life * blinkRate) > 0 ? masterAlpha : 0.15;
    }
    g.setAlpha(masterAlpha);

    const glow = 0.25 + Math.sin(this.pulse) * 0.12;
    const ringRadius = this.radius + 5 + Math.sin(this.pulse * 1.3) * 3;

    // Outer glow ring
    g.lineStyle(1, COLORS.BOMB, glow * 0.6);
    g.strokeCircle(0, 0, this.radius * 2.5);

    // Filled circle body
    g.fillStyle(COLORS.BOMB, 0.15);
    g.fillCircle(0, 0, this.radius);

    // Bomb outline — circle with a fuse nub
    g.lineStyle(1.5, COLORS.BOMB, 0.9);
    g.strokeCircle(0, 0, this.radius * 0.8);

    // Fuse line on top
    g.lineStyle(1.5, COLORS.GATE, 0.9);
    g.lineBetween(0, -this.radius * 0.8, 2, -this.radius * 1.3);

    // Spark at fuse tip (pulsing)
    const sparkAlpha = 0.5 + Math.sin(this.pulse * 6) * 0.5;
    g.fillStyle(0xffffff, sparkAlpha);
    g.fillCircle(2, -this.radius * 1.3, 2);

    // Inner cross emblem
    g.lineStyle(1, 0xffffff, 0.5);
    g.lineBetween(-4, 0, 4, 0);
    g.lineBetween(0, -4, 0, 4);

    // Pulsing ring
    g.lineStyle(1, COLORS.BOMB, glow + 0.2);
    g.strokeCircle(0, 0, ringRadius);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
