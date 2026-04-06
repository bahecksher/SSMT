import Phaser from 'phaser';
import { COLORS } from '../constants';

export const SHIELD_PICKUP_RADIUS = 14;

export class ShieldPickup {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = SHIELD_PICKUP_RADIUS;
  active = true;

  private pulse = 0;
  private life = 30000;

  constructor(scene: Phaser.Scene, x: number, y: number, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.graphic = scene.add.graphics().setDepth(7);
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
    this.graphic.setPosition(this.x, this.y);

    this.pulse += delta * 0.004;
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    // Blink for last 5 seconds before expiring
    let alpha = 1;
    if (this.life < 5000) {
      const blinkRate = this.life < 2500 ? 0.12 : 0.06;
      alpha = Math.sin(this.life * blinkRate) > 0 ? 1 : 0.15;
    }
    g.setAlpha(alpha);

    const glow = 0.3 + Math.sin(this.pulse) * 0.15;

    // Outer glow ring
    g.lineStyle(1, COLORS.SHIELD, glow * 0.2);
    g.strokeCircle(0, 0, SHIELD_PICKUP_RADIUS * 2.5);

    // Shield shape — hexagon (stroke-based)
    g.lineStyle(1.5, COLORS.SHIELD, 0.8);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const px = Math.cos(a) * SHIELD_PICKUP_RADIUS;
      const py = Math.sin(a) * SHIELD_PICKUP_RADIUS;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.strokePath();

    // Subtle hologram fill
    g.fillStyle(COLORS.SHIELD, 0.05);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const px = Math.cos(a) * SHIELD_PICKUP_RADIUS;
      const py = Math.sin(a) * SHIELD_PICKUP_RADIUS;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    // Inner emblem — small diamond (stroke)
    g.lineStyle(1, 0xffffff, 0.5);
    const s = SHIELD_PICKUP_RADIUS * 0.35;
    g.beginPath();
    g.moveTo(0, -s);
    g.lineTo(s, 0);
    g.lineTo(0, s);
    g.lineTo(-s, 0);
    g.closePath();
    g.strokePath();

    // Pulsing ring
    g.lineStyle(1, COLORS.SHIELD, glow + 0.15);
    g.strokeCircle(0, 0, SHIELD_PICKUP_RADIUS + 4 + Math.sin(this.pulse * 1.5) * 2);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
