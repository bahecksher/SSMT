import Phaser from 'phaser';
import { COLORS } from '../constants';
import { DRIFTER_RADIUS, DRIFTER_MINING_RADIUS_MULT, DRIFTER_MAX_HP, DRIFTER_SPEED_MAX, HP_DEPLETED_WARN_TIME } from '../data/tuning';
import { getLayout } from '../layout';
import { rotatePoint } from '../utils/geometry';

export class DrifterHazard {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  miningRadius: number;
  radiusScale: number;
  isMineable: boolean;
  active = true;
  inverted = false;

  // Health system
  hp: number = 0;
  maxHp: number = 0;
  depleted = false;
  private depletedTimer = 0;

  /** How many asteroid-asteroid bounces this drifter has had. */
  bounceCount = 0;

  private angle = 0;
  private spinSpeed: number;
  private vertices: [number, number][];
  private miningPulse = 0;

  // Minimum scale below which fragments won't split further
  static readonly MIN_SPLIT_SCALE = 0.6;

  private static generateVertices(radius: number): [number, number][] {
    const count = Phaser.Math.Between(5, 8);
    const verts: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i;
      const dist = radius * Phaser.Math.FloatBetween(0.7, 1.0);
      verts.push([Math.cos(a) * dist, Math.sin(a) * dist]);
    }
    return verts;
  }

  constructor(scene: Phaser.Scene, speed: number, radiusScale = 1, isMineable = false) {
    const layout = getLayout();
    this.radiusScale = radiusScale;
    this.radius = DRIFTER_RADIUS * radiusScale;
    this.miningRadius = this.radius * DRIFTER_MINING_RADIUS_MULT;
    this.isMineable = isMineable;
    this.maxHp = DRIFTER_MAX_HP * radiusScale;
    this.hp = this.maxHp;
    this.spinSpeed = Phaser.Math.FloatBetween(0.2, 0.6) * (Math.random() < 0.5 ? 1 : -1);
    this.vertices = DrifterHazard.generateVertices(this.radius);

    // Pick a random edge to spawn from
    const edge = Phaser.Math.Between(0, 3);
    const margin = this.radius + 10;

    let targetX: number;
    let targetY: number;

    switch (edge) {
      case 0: // top
        this.x = Phaser.Math.Between(0, layout.gameWidth);
        this.y = -margin;
        targetX = Phaser.Math.Between(0, layout.gameWidth);
        targetY = layout.gameHeight + margin;
        break;
      case 1: // bottom
        this.x = Phaser.Math.Between(0, layout.gameWidth);
        this.y = layout.gameHeight + margin;
        targetX = Phaser.Math.Between(0, layout.gameWidth);
        targetY = -margin;
        break;
      case 2: // left
        this.x = -margin;
        this.y = Phaser.Math.Between(0, layout.gameHeight);
        targetX = layout.gameWidth + margin;
        targetY = Phaser.Math.Between(0, layout.gameHeight);
        break;
      default: // right
        this.x = layout.gameWidth + margin;
        this.y = Phaser.Math.Between(0, layout.gameHeight);
        targetX = -margin;
        targetY = Phaser.Math.Between(0, layout.gameHeight);
        break;
    }

    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.graphic = scene.add.graphics().setDepth(5);
    this.draw();
    this.graphic.setPosition(this.x, this.y);
  }

  /** Create a fragment at a specific position with given velocity (no edge spawn) */
  static createFragment(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radiusScale: number,
    isMineable = false,
  ): DrifterHazard {
    const d = Object.create(DrifterHazard.prototype) as DrifterHazard;
    d.radiusScale = radiusScale;
    d.radius = DRIFTER_RADIUS * radiusScale;
    d.miningRadius = d.radius * DRIFTER_MINING_RADIUS_MULT;
    d.isMineable = isMineable;
    d.maxHp = DRIFTER_MAX_HP * radiusScale;
    d.hp = d.maxHp;
    d.depleted = false;
    d.x = x;
    d.y = y;
    d.vx = vx;
    d.vy = vy;
    d.active = true;
    d.inverted = false;
    d.bounceCount = 0;
    d.depletedTimer = 0;
    d.miningPulse = 0;
    d.angle = 0;
    d.spinSpeed = Phaser.Math.FloatBetween(0.2, 0.6) * (Math.random() < 0.5 ? 1 : -1);
    d.vertices = DrifterHazard.generateVertices(d.radius);
    d.graphic = scene.add.graphics().setDepth(5);
    d.draw();
    d.graphic.setPosition(d.x, d.y);
    return d;
  }

  update(delta: number): void {
    if (!this.active) return;

    // HP depleted — flash then destroy
    if (this.depleted) {
      this.depletedTimer += delta;
      if (this.depletedTimer >= HP_DEPLETED_WARN_TIME) {
        this.active = false;
        return;
      }
      const blinkRate = this.depletedTimer > HP_DEPLETED_WARN_TIME * 0.66 ? 0.12 : 0.06;
      const visible = Math.sin(this.depletedTimer * blinkRate) > 0;
      this.graphic.setAlpha(visible ? 1 : 0.2);
      // Still move while flashing
      const dt = delta / 1000;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.graphic.setPosition(this.x, this.y);
      return;
    }

    const dt = delta / 1000;

    // Clamp speed after bounces
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > DRIFTER_SPEED_MAX) {
      const scale = DRIFTER_SPEED_MAX / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spinSpeed * dt;
    this.miningPulse += dt * 2;
    this.graphic.setPosition(this.x, this.y);
    this.draw();

    // Deactivate when fully offscreen
    const offMargin = this.radius + 60;
    const layout = getLayout();
    if (
      this.x < -offMargin ||
      this.x > layout.gameWidth + offMargin ||
      this.y < -offMargin ||
      this.y > layout.gameHeight + offMargin
    ) {
      this.active = false;
    }
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    g.setAlpha(1);

    const r = this.radius;
    const mr = this.miningRadius;

    const color = this.inverted ? 0x000000 : (this.isMineable ? COLORS.ASTEROID : COLORS.ASTEROID_INERT);
    const miningColor = this.inverted ? 0x000000 : COLORS.ASTEROID;

    if (this.isMineable && this.radiusScale >= 1.5) {
      // Mining zone - pulsing filled area
      const miningAlpha = 0.06 + Math.sin(this.miningPulse) * 0.03;
      g.fillStyle(miningColor, miningAlpha);
      g.fillCircle(0, 0, mr);

      // Mining zone ring - dashed rotating segments
      const segCount = 12;
      const segGap = 0.2;
      const segAngle = (Math.PI * 2) / segCount;
      const ringAlpha = 0.25 + Math.sin(this.miningPulse) * 0.1;
      g.lineStyle(1.5, miningColor, ringAlpha);
      for (let i = 0; i < segCount; i++) {
        const startA = i * segAngle + this.miningPulse * 0.3;
        const endA = startA + segAngle - segGap;
        g.beginPath();
        g.arc(0, 0, mr, startA, endA, false);
        g.strokePath();
      }
    }

    // Randomized asteroid shape, rotated (stroke-based hologram)
    g.lineStyle(1.5, color, 0.9);
    g.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const [rx, ry] = rotatePoint(this.vertices[i][0], this.vertices[i][1], this.angle);
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.strokePath();

    // Solid fill
    g.fillStyle(color, 0.4);
    g.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const [rx, ry] = rotatePoint(this.vertices[i][0], this.vertices[i][1], this.angle);
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.fillPath();

    // Inner detail
    g.fillStyle(color, 0.5);
    g.fillCircle(0, 0, r * 0.25);

    // HP bar (shows when damaged)
    if (this.isMineable && this.hp < this.maxHp) {
      const barW = Math.max(16, r * 1.5);
      const barH = 3;
      const barY = r + 6;
      const hpFrac = Math.max(0, this.hp / this.maxHp);

      g.fillStyle(0x000000, 0.5);
      g.fillRect(-barW / 2, barY, barW, barH);

      const barColor = hpFrac > 0.5 ? COLORS.ASTEROID : (hpFrac > 0.25 ? COLORS.ASTEROID_INERT : COLORS.ASTEROID);
      g.fillStyle(barColor, 0.8);
      g.fillRect(-barW / 2, barY, barW * hpFrac, barH);

      g.lineStyle(0.5, 0xffffff, 0.3);
      g.strokeRect(-barW / 2, barY, barW, barH);
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
  }
}
