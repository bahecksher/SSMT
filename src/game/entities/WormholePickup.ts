import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  EXIT_GATE_RADIUS,
  WORMHOLE_PICKUP_LIFETIME,
  WORMHOLE_PICKUP_RADIUS,
} from '../data/tuning';

export class WormholePickup {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = WORMHOLE_PICKUP_RADIUS;
  active = true;

  private pulse = 0;
  private swirl = 0;
  private life = WORMHOLE_PICKUP_LIFETIME;
  private elapsed = 0;
  private readonly previewTime: number;
  private readonly activeTime: number;

  constructor(scene: Phaser.Scene, x: number, y: number, vx = 0, vy = 0, previewTime = 0, activeTime = WORMHOLE_PICKUP_LIFETIME) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.previewTime = Math.max(0, previewTime);
    this.activeTime = Math.max(1000, activeTime);
    this.life = this.previewTime + this.activeTime;
    this.graphic = scene.add.graphics().setDepth(9);
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  isCollectable(): boolean {
    return this.elapsed >= this.previewTime;
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    this.elapsed += delta;
    this.life -= delta;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    if (this.isCollectable()) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    this.pulse += delta * 0.004;
    this.swirl += delta * 0.0024;
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    let alpha = 1;
    if (this.life < 5000) {
      const blinkRate = this.life < 2500 ? 0.12 : 0.06;
      alpha = Math.sin(this.life * blinkRate) > 0 ? 1 : 0.2;
    }
    g.setAlpha(alpha);

    const glow = 0.25 + Math.sin(this.pulse) * 0.12;
    const collectable = this.isCollectable();
    const gateColor = COLORS.HUD;
    const hudColor = COLORS.GATE;

    if (this.previewTime > 0 && !collectable) {
      const previewProgress = Phaser.Math.Clamp(this.elapsed / this.previewTime, 0, 1);
      const coreRadius = EXIT_GATE_RADIUS * 0.5;
      const maxRadius = EXIT_GATE_RADIUS * 5;
      const closingRadius = maxRadius - (maxRadius - coreRadius) * previewProgress;
      const alpha = 0.08 + previewProgress * 0.36;
      const bracketRadius = EXIT_GATE_RADIUS + 8;
      const bracketLength = 10 + previewProgress * 10;

      g.lineStyle(1.5, gateColor, alpha);
      g.strokeCircle(0, 0, closingRadius);
      g.lineStyle(1, hudColor, 0.12 + previewProgress * 0.18);
      g.strokeCircle(0, 0, closingRadius * 0.55);
      g.lineStyle(1.4, gateColor, 0.18 + previewProgress * 0.3);
      g.lineBetween(-bracketRadius - bracketLength, 0, -bracketRadius, 0);
      g.lineBetween(bracketRadius, 0, bracketRadius + bracketLength, 0);
      g.lineBetween(0, -bracketRadius - bracketLength, 0, -bracketRadius);
      g.lineBetween(0, bracketRadius, 0, bracketRadius + bracketLength);
    }

    g.lineStyle(1, hudColor, (collectable ? 0.22 : 0.12) + glow * 0.5);
    g.strokeCircle(0, 0, collectable ? this.radius * 2.9 : this.radius * 2.3);

    g.lineStyle(1.5, gateColor, collectable ? 0.9 : 0.45);
    g.strokeCircle(0, 0, this.radius * 0.95);

    g.fillStyle(gateColor, collectable ? 0.11 : 0.04);
    g.fillCircle(0, 0, this.radius * 0.82);

    for (let i = 0; i < 3; i += 1) {
      const start = this.swirl + i * ((Math.PI * 2) / 3);
      const end = start + Math.PI * 0.8;
      const arcRadius = this.radius + 4 + i * 2;
      g.lineStyle(1.2, hudColor, (collectable ? 0.35 : 0.18) + i * 0.1);
      g.beginPath();
      g.arc(0, 0, arcRadius, start, end, false);
      g.strokePath();
    }

    const coreRadius = this.radius * 0.35;
    g.lineStyle(1, 0xffffff, 0.55);
    g.beginPath();
    g.moveTo(0, -coreRadius);
    g.lineTo(coreRadius, 0);
    g.lineTo(0, coreRadius);
    g.lineTo(-coreRadius, 0);
    g.closePath();
    g.strokePath();

    if (this.previewTime > 0 && collectable) {
      const activeElapsed = Math.max(0, this.elapsed - this.previewTime);
      const remaining = 1 - Phaser.Math.Clamp(activeElapsed / this.activeTime, 0, 1);
      g.lineStyle(2, hudColor, 0.5);
      g.beginPath();
      g.arc(0, 0, EXIT_GATE_RADIUS + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining, false);
      g.strokePath();
    }
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
