import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import {
  SALVAGE_RADIUS,
  SALVAGE_DRIFT_SPEED_MIN,
  SALVAGE_DRIFT_SPEED_MAX,
  SALVAGE_MAX_HP,
  HP_DEPLETED_WARN_TIME,
} from '../data/tuning';

function rotatePoint(px: number, py: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [px * cos - py * sin, px * sin + py * cos];
}

export interface SalvageDebrisConfig {
  isRare?: boolean;
  lifetime?: number;        // ms, 0 = no limit
  pointsMultiplier?: number;
  radiusScale?: number;
}

export class SalvageDebris {
  graphic: Phaser.GameObjects.Graphics;
  radiusGraphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  active = true;
  inverted = false;

  // Rare salvage properties
  readonly isRare: boolean;
  readonly pointsMultiplier: number;
  readonly salvageRadius: number;
  private lifetime: number;  // ms remaining, 0 = infinite

  // Health system
  hp: number;
  readonly maxHp: number;
  private depletedTimer = 0;  // counts up after HP hits 0
  depleted = false;           // true when HP reached 0 (flashing before explode)

  readonly driftVx: number = 0;
  readonly driftVy: number = 0;
  private vx: number;
  private vy: number;
  private radiusPulse = 0;

  private angle = 0;
  private spinSpeed: number;
  private vertices: [number, number][];
  private innerLines: [number, number, number, number][];

  private static generateVertices(baseRadius: number): [number, number][] {
    const count = Phaser.Math.Between(6, 10);
    const verts: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i;
      const dist = baseRadius * Phaser.Math.FloatBetween(0.6, 1.0);
      verts.push([Math.cos(a) * dist, Math.sin(a) * dist]);
    }
    return verts;
  }

  private static generateInnerLines(baseRadius: number): [number, number, number, number][] {
    const lines: [number, number, number, number][] = [];
    const count = Phaser.Math.Between(2, 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const len = baseRadius * Phaser.Math.FloatBetween(0.4, 0.8);
      lines.push([
        Math.cos(a) * len * 0.3,
        Math.sin(a) * len * 0.3,
        Math.cos(a) * len,
        Math.sin(a) * len,
      ]);
    }
    return lines;
  }

  constructor(scene: Phaser.Scene, config?: SalvageDebrisConfig) {
    const cfg = config ?? {};
    this.isRare = cfg.isRare ?? false;
    this.pointsMultiplier = cfg.pointsMultiplier ?? 1;
    this.salvageRadius = SALVAGE_RADIUS * (cfg.radiusScale ?? 1);
    this.lifetime = cfg.lifetime ?? 0;

    this.maxHp = SALVAGE_MAX_HP * (this.isRare ? 0.5 : 1);
    this.hp = this.maxHp;

    const shapeRadius = this.isRare ? 10 : 20;
    this.vertices = SalvageDebris.generateVertices(shapeRadius);
    this.innerLines = SalvageDebris.generateInnerLines(shapeRadius);
    this.spinSpeed = Phaser.Math.FloatBetween(0.3, 0.8) * (Math.random() < 0.5 ? 1 : -1);

    // Spawn from a random screen edge, aimed at the interior
    const edge = Phaser.Math.Between(0, 3);
    const margin = this.salvageRadius;

    let targetX: number;
    let targetY: number;

    switch (edge) {
      case 0: // top
        this.x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
        this.y = -margin;
        targetX = Phaser.Math.Between(margin, GAME_WIDTH - margin);
        targetY = Phaser.Math.Between(GAME_HEIGHT * 0.3, GAME_HEIGHT * 0.7);
        break;
      case 1: // bottom
        this.x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
        this.y = GAME_HEIGHT + margin;
        targetX = Phaser.Math.Between(margin, GAME_WIDTH - margin);
        targetY = Phaser.Math.Between(GAME_HEIGHT * 0.3, GAME_HEIGHT * 0.7);
        break;
      case 2: // left
        this.x = -margin;
        this.y = Phaser.Math.Between(margin, GAME_HEIGHT - margin);
        targetX = Phaser.Math.Between(GAME_WIDTH * 0.3, GAME_WIDTH * 0.7);
        targetY = Phaser.Math.Between(margin, GAME_HEIGHT - margin);
        break;
      default: // right
        this.x = GAME_WIDTH + margin;
        this.y = Phaser.Math.Between(margin, GAME_HEIGHT - margin);
        targetX = Phaser.Math.Between(GAME_WIDTH * 0.3, GAME_WIDTH * 0.7);
        targetY = Phaser.Math.Between(margin, GAME_HEIGHT - margin);
        break;
    }

    // Drift toward the interior target, then continue through the other side
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const speed = Phaser.Math.FloatBetween(SALVAGE_DRIFT_SPEED_MIN, SALVAGE_DRIFT_SPEED_MAX);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    (this as { driftVx: number }).driftVx = this.vx;
    (this as { driftVy: number }).driftVy = this.vy;

    // Salvage radius indicator (drawn behind debris)
    this.radiusGraphic = scene.add.graphics().setDepth(1);

    // Debris body
    this.graphic = scene.add.graphics().setDepth(2);
    this.drawDebris();
    this.drawRadius();

    this.graphic.setPosition(this.x, this.y);
    this.radiusGraphic.setPosition(this.x, this.y);
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spinSpeed * dt;

    this.graphic.setPosition(this.x, this.y);
    this.radiusGraphic.setPosition(this.x, this.y);

    // Redraw spinning debris
    this.drawDebris();

    // Pulse the radius ring
    this.radiusPulse += delta * 0.003;
    this.drawRadius();

    // HP depleted — flash for warning period then explode
    if (this.depleted) {
      this.depletedTimer += delta;
      if (this.depletedTimer >= HP_DEPLETED_WARN_TIME) {
        this.active = false;
        return;
      }
      // Fast blink
      const blinkRate = this.depletedTimer > HP_DEPLETED_WARN_TIME * 0.66 ? 0.12 : 0.06;
      const visible = Math.sin(this.depletedTimer * blinkRate) > 0;
      this.graphic.setAlpha(visible ? 1 : 0.2);
      this.radiusGraphic.setAlpha(visible ? 0.5 : 0.1);
      return; // Skip normal lifetime logic while depleted
    }

    // Lifetime countdown for rare salvage
    if (this.lifetime > 0) {
      this.lifetime -= delta;
      if (this.lifetime <= 0) {
        this.active = false;
        return;
      }
      // Blink when close to expiring (last 3 seconds)
      if (this.lifetime < 3000) {
        const blinkRate = this.lifetime < 1500 ? 0.08 : 0.15;
        const visible = Math.sin(this.lifetime * blinkRate) > 0;
        this.graphic.setAlpha(visible ? 1 : 0.3);
        this.radiusGraphic.setAlpha(visible ? 1 : 0.3);
      }
    }

    // Check if fully offscreen (with margin)
    const offMargin = this.salvageRadius + 40;
    if (
      this.x < -offMargin ||
      this.x > GAME_WIDTH + offMargin ||
      this.y < -offMargin ||
      this.y > GAME_HEIGHT + offMargin
    ) {
      this.active = false;
    }
  }

  private drawDebris(): void {
    const g = this.graphic;
    g.clear();

    // Hologram flicker
    if (!this.inverted && Math.random() < 0.03) {
      g.setAlpha(0.4);
    } else {
      g.setAlpha(1);
    }

    const color = this.inverted ? 0x000000 : (this.isRare ? 0xff44ff : COLORS.SALVAGE);

    // Randomized polygon shape, rotated (stroke-based hologram)
    g.lineStyle(1.5, color, 0.9);
    g.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const [rx, ry] = rotatePoint(this.vertices[i][0], this.vertices[i][1], this.angle);
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.strokePath();

    // Subtle hologram fill
    g.fillStyle(color, 0.05);
    g.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const [rx, ry] = rotatePoint(this.vertices[i][0], this.vertices[i][1], this.angle);
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.fillPath();

    // Inner detail lines
    g.lineStyle(1, color, 0.3);
    for (const line of this.innerLines) {
      const [x1, y1] = rotatePoint(line[0], line[1], this.angle);
      const [x2, y2] = rotatePoint(line[2], line[3], this.angle);
      g.lineBetween(x1, y1, x2, y2);
    }

    // Center dot
    g.fillStyle(color, 0.4);
    g.fillCircle(0, 0, this.isRare ? 2 : 3);

    // HP bar (shows when damaged)
    if (this.hp < this.maxHp) {
      const barW = 24;
      const barH = 3;
      const barY = (this.isRare ? 10 : 20) + 8;
      const hpFrac = Math.max(0, this.hp / this.maxHp);

      // Background
      g.fillStyle(0x000000, 0.5);
      g.fillRect(-barW / 2, barY, barW, barH);

      // Fill — green to red
      const barColor = hpFrac > 0.5 ? COLORS.SALVAGE : (hpFrac > 0.25 ? 0xffaa00 : COLORS.HAZARD);
      g.fillStyle(barColor, 0.8);
      g.fillRect(-barW / 2, barY, barW * hpFrac, barH);

      // Border
      g.lineStyle(0.5, 0xffffff, 0.3);
      g.strokeRect(-barW / 2, barY, barW, barH);
    }
  }

  private drawRadius(): void {
    const g = this.radiusGraphic;
    g.clear();

    const color = this.isRare ? 0xff44ff : COLORS.SALVAGE_RADIUS;
    const pulseAlpha = 0.12 + Math.sin(this.radiusPulse) * 0.06;

    // Filled salvage zone
    g.fillStyle(color, pulseAlpha * 0.3);
    g.fillCircle(0, 0, this.salvageRadius);

    // Dashed ring effect using arcs
    g.lineStyle(1.5, color, pulseAlpha + 0.1);
    const segments = 16;
    const gap = 0.15;
    const segAngle = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      const startAngle = i * segAngle + this.radiusPulse * 0.2;
      const endAngle = startAngle + segAngle - gap;
      g.beginPath();
      g.arc(0, 0, this.salvageRadius, startAngle, endAngle, false);
      g.strokePath();
    }
  }

  /** Returns polygon vertices in world space (rotated + translated). */
  getWorldVertices(): [number, number][] {
    return this.vertices.map(([vx, vy]) => {
      const [rx, ry] = rotatePoint(vx, vy, this.angle);
      return [this.x + rx, this.y + ry] as [number, number];
    });
  }

  destroy(): void {
    this.graphic.destroy();
    this.radiusGraphic.destroy();
  }
}
