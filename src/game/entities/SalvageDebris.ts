import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  SALVAGE_RADIUS,
  SALVAGE_DRIFT_SPEED_MIN,
  SALVAGE_DRIFT_SPEED_MAX,
  SALVAGE_MAX_HP,
  HP_DEPLETED_WARN_TIME,
} from '../data/tuning';
import { getLayout } from '../layout';

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
  /** Each module: [offsetX, offsetY, halfW, halfH, angleOffset] */
  private rects: [number, number, number, number, number][];

  /**
   * Generate 2-3 rectangular modules connected edge-to-edge.
   * Child modules attach flush to a random point along a parent edge,
   * oriented perpendicular to the parent.
   */
  private static generateRects(baseRadius: number): [number, number, number, number, number][] {
    const count = Phaser.Math.Between(2, 3);
    const rects: [number, number, number, number, number][] = [];

    // First module — the core, centered at origin, no rotation
    const hw0 = baseRadius * Phaser.Math.FloatBetween(0.55, 0.8);
    const hh0 = baseRadius * Phaser.Math.FloatBetween(0.2, 0.35);
    rects.push([0, 0, hw0, hh0, 0]);

    for (let i = 1; i < count; i++) {
      const prev = rects[i - 1];
      const [pOx, pOy, pHw, pHh] = prev;

      // New module: long and thin, perpendicular to parent
      const hw = baseRadius * Phaser.Math.FloatBetween(0.15, 0.3);
      const hh = baseRadius * Phaser.Math.FloatBetween(0.4, 0.7);

      // Pick a random edge (0=right, 1=left, 2=bottom, 3=top)
      const edge = Phaser.Math.Between(0, 3);
      // Random attachment point along that edge
      const t = Phaser.Math.FloatBetween(-0.7, 0.7);

      let ox: number;
      let oy: number;
      switch (edge) {
        case 0: // right edge — child center flush against parent right
          ox = pOx + pHw + hw;
          oy = pOy + t * pHh;
          break;
        case 1: // left edge
          ox = pOx - pHw - hw;
          oy = pOy + t * pHh;
          break;
        case 2: // bottom edge
          ox = pOx + t * pHw;
          oy = pOy + pHh + hw;
          break;
        default: // top edge
          ox = pOx + t * pHw;
          oy = pOy - pHh - hw;
          break;
      }

      // For top/bottom edges, rotate child 90° so it extends outward
      const angle = (edge >= 2) ? Math.PI / 2 : 0;

      rects.push([ox, oy, hw, hh, angle]);
    }

    return rects;
  }

  constructor(scene: Phaser.Scene, config?: SalvageDebrisConfig) {
    const layout = getLayout();
    const cfg = config ?? {};
    this.isRare = cfg.isRare ?? false;
    this.pointsMultiplier = cfg.pointsMultiplier ?? 1;
    this.salvageRadius = SALVAGE_RADIUS * (cfg.radiusScale ?? 1);
    this.lifetime = cfg.lifetime ?? 0;

    this.maxHp = SALVAGE_MAX_HP * (this.isRare ? 0.5 : 1);
    this.hp = this.maxHp;

    const shapeRadius = this.isRare ? 45 : 80;
    this.rects = SalvageDebris.generateRects(shapeRadius);
    this.spinSpeed = Phaser.Math.FloatBetween(0.15, 0.45) * (Math.random() < 0.5 ? 1 : -1);

    // Spawn from a random screen edge, aimed at the interior
    const edge = Phaser.Math.Between(0, 3);
    const margin = this.salvageRadius;

    let targetX: number;
    let targetY: number;

    switch (edge) {
      case 0: // top
        this.x = Phaser.Math.Between(margin, layout.gameWidth - margin);
        this.y = -margin;
        targetX = Phaser.Math.Between(margin, layout.gameWidth - margin);
        targetY = Phaser.Math.Between(layout.gameHeight * 0.3, layout.gameHeight * 0.7);
        break;
      case 1: // bottom
        this.x = Phaser.Math.Between(margin, layout.gameWidth - margin);
        this.y = layout.gameHeight + margin;
        targetX = Phaser.Math.Between(margin, layout.gameWidth - margin);
        targetY = Phaser.Math.Between(layout.gameHeight * 0.3, layout.gameHeight * 0.7);
        break;
      case 2: // left
        this.x = -margin;
        this.y = Phaser.Math.Between(margin, layout.gameHeight - margin);
        targetX = Phaser.Math.Between(layout.gameWidth * 0.3, layout.gameWidth * 0.7);
        targetY = Phaser.Math.Between(margin, layout.gameHeight - margin);
        break;
      default: // right
        this.x = layout.gameWidth + margin;
        this.y = Phaser.Math.Between(margin, layout.gameHeight - margin);
        targetX = Phaser.Math.Between(layout.gameWidth * 0.3, layout.gameWidth * 0.7);
        targetY = Phaser.Math.Between(margin, layout.gameHeight - margin);
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

  private drawDebris(): void {
    const g = this.graphic;
    g.clear();
    g.setAlpha(1);

    const color = this.inverted ? 0x000000 : (this.isRare ? 0xff44ff : COLORS.SALVAGE);

    // Layered rectangles — each at its own offset and angle
    for (let ri = 0; ri < this.rects.length; ri++) {
      const [ox, oy, hw, hh, aOff] = this.rects[ri];
      const rectAngle = this.angle + aOff;
      const corners: [number, number][] = [
        [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
      ];

      // Rotate corners and offset
      const worldCorners = corners.map(([cx, cy]) => {
        const [rx, ry] = rotatePoint(cx, cy, rectAngle);
        return [rx + rotatePoint(ox, oy, this.angle)[0], ry + rotatePoint(ox, oy, this.angle)[1]] as [number, number];
      });

      // Subtle hologram fill (deeper layers dimmer)
      const layerAlpha = 0.04 + (ri / this.rects.length) * 0.04;
      g.fillStyle(color, layerAlpha);
      g.beginPath();
      for (let i = 0; i < worldCorners.length; i++) {
        if (i === 0) g.moveTo(worldCorners[i][0], worldCorners[i][1]);
        else g.lineTo(worldCorners[i][0], worldCorners[i][1]);
      }
      g.closePath();
      g.fillPath();

      // Stroke outline
      const strokeAlpha = 0.5 + (ri / this.rects.length) * 0.4;
      g.lineStyle(1.2, color, strokeAlpha);
      g.beginPath();
      for (let i = 0; i < worldCorners.length; i++) {
        if (i === 0) g.moveTo(worldCorners[i][0], worldCorners[i][1]);
        else g.lineTo(worldCorners[i][0], worldCorners[i][1]);
      }
      g.closePath();
      g.strokePath();

      // Cross-brace detail on the largest rect
      if (ri === this.rects.length - 1) {
        g.lineStyle(0.8, color, 0.25);
        g.lineBetween(worldCorners[0][0], worldCorners[0][1], worldCorners[2][0], worldCorners[2][1]);
        g.lineBetween(worldCorners[1][0], worldCorners[1][1], worldCorners[3][0], worldCorners[3][1]);
      }
    }

    // Center dot
    g.fillStyle(color, 0.5);
    g.fillCircle(0, 0, this.isRare ? 2 : 3);

    // HP bar (shows when damaged)
    if (this.hp < this.maxHp) {
      const barW = 40;
      const barH = 3;
      const barY = (this.isRare ? 45 : 80) + 8;
      const hpFrac = Math.max(0, this.hp / this.maxHp);

      g.fillStyle(0x000000, 0.5);
      g.fillRect(-barW / 2, barY, barW, barH);

      const barColor = hpFrac > 0.5 ? COLORS.SALVAGE : (hpFrac > 0.25 ? 0xffaa00 : COLORS.HAZARD);
      g.fillStyle(barColor, 0.8);
      g.fillRect(-barW / 2, barY, barW * hpFrac, barH);

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

  /** Create debris at a specific position with given velocity (no edge spawn). */
  static createAt(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
  ): SalvageDebris {
    const d = new SalvageDebris(scene);
    // Override spawn position and velocity
    d.x = x;
    d.y = y;
    (d as unknown as { vx: number }).vx = vx;
    (d as unknown as { vy: number }).vy = vy;
    (d as { driftVx: number }).driftVx = vx;
    (d as { driftVy: number }).driftVy = vy;
    d.graphic.setPosition(x, y);
    d.radiusGraphic.setPosition(x, y);
    return d;
  }

  /** Returns corners of the outermost rect in world space. */
  getWorldVertices(): [number, number][] {
    if (this.rects.length === 0) return [];
    const last = this.rects[this.rects.length - 1];
    const [ox, oy, hw, hh, aOff] = last;
    const rectAngle = this.angle + aOff;
    const corners: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    return corners.map(([cx, cy]) => {
      const [rx, ry] = rotatePoint(cx, cy, rectAngle);
      const [oRx, oRy] = rotatePoint(ox, oy, this.angle);
      return [this.x + rx + oRx, this.y + ry + oRy] as [number, number];
    });
  }

  destroy(): void {
    this.graphic.destroy();
    this.radiusGraphic.destroy();
  }
}
