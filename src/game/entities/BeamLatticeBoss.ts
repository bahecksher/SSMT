import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  BEAM_LATTICE_BEAM_WIDTH,
  BEAM_LATTICE_BODY_RADIUS,
  BEAM_LATTICE_CHARGE_TELEGRAPH_MS,
  BEAM_LATTICE_COOLDOWN_MS,
  BEAM_LATTICE_CORE_INNER_RADIUS,
  BEAM_LATTICE_CORE_OUTER_RADIUS,
  BEAM_LATTICE_DANGER_INNER,
  BEAM_LATTICE_DANGER_OUTER,
  BEAM_LATTICE_FIRE_MS,
  BEAM_LATTICE_HARDPOINT_COUNT,
  BEAM_LATTICE_HARDPOINT_ORBIT_RADIUS,
  BEAM_LATTICE_HARDPOINT_RADIUS,
  BEAM_LATTICE_ROTATION_SPEED,
  BEAM_LATTICE_SALVAGE_MULTIPLIER,
  BEAM_LATTICE_VIEW_OVERSHOOT,
} from '../data/tuning';
import { getLayout } from '../layout';
import type { BossDestructionPlan, BossDropData, BossEntity, BossVentDrop } from './BossEntity';

interface BeamArmState {
  baseAngle: number;
  alive: boolean;
}

type BeamCycleState = 'cooldown' | 'fire';

const ENTRY_DRIFT_SPEED = 110;
const ENTRY_OFFSET = BEAM_LATTICE_BODY_RADIUS * 4 + 96;

interface BeamSegment {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
}

export class BeamLatticeBoss implements BossEntity {
  graphic: Phaser.GameObjects.Graphics;
  active = true;

  private x = 0;
  private y = 0;
  private targetX = 0;
  private targetY = 0;
  private rotation = 0;
  private pulse = 0;
  private corePulse = 0;
  private coreEntryPrimed = false;
  private entryComplete = false;
  private arms: BeamArmState[] = [];
  private cycleState: BeamCycleState = 'cooldown';
  private cycleMs = 0;
  private warningPulsePending = false;

  constructor(scene: Phaser.Scene, beamCount = BEAM_LATTICE_HARDPOINT_COUNT) {
    this.graphic = scene.add.graphics().setDepth(6);

    for (let i = 0; i < beamCount; i++) {
      this.arms.push({
        baseAngle: (i / beamCount) * Math.PI * 2,
        alive: true,
      });
    }

    const layout = getLayout();
    this.targetX = (layout.arenaLeft + layout.arenaRight) / 2;
    this.targetY = (layout.arenaTop + layout.arenaBottom) / 2;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Math.max(layout.arenaWidth, layout.arenaHeight) / 2 + ENTRY_OFFSET;
    this.x = this.targetX + Math.cos(angle) * radius;
    this.y = this.targetY + Math.sin(angle) * radius;

    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    this.pulse += delta * 0.005;
    this.corePulse += delta * 0.0045;

    if (!this.entryComplete) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = ENTRY_DRIFT_SPEED * (delta / 1000);
      if (dist <= step + 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.entryComplete = true;
        this.cycleState = 'cooldown';
        this.cycleMs = 0;
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    } else {
      this.rotation += BEAM_LATTICE_ROTATION_SPEED * (delta / 1000);
      this.advanceCycle(delta);
    }

    this.draw();
  }

  consumeWarningPulse(): boolean {
    const pending = this.warningPulsePending;
    this.warningPulsePending = false;
    return pending;
  }

  private advanceCycle(delta: number): void {
    if (this.isCoreExposed()) return;
    this.cycleMs += delta;
    if (this.cycleState === 'cooldown' && this.cycleMs >= BEAM_LATTICE_COOLDOWN_MS) {
      this.cycleState = 'fire';
      this.cycleMs = 0;
      this.warningPulsePending = true;
    } else if (this.cycleState === 'fire' && this.cycleMs >= BEAM_LATTICE_FIRE_MS) {
      this.cycleState = 'cooldown';
      this.cycleMs = 0;
    }
  }

  consumeAsteroidVents(): BossVentDrop[] {
    return [];
  }

  checkBeamHit(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.active || !this.entryComplete || this.isCoreExposed() || this.cycleState !== 'fire') {
      return false;
    }
    const halfWidth = BEAM_LATTICE_BEAM_WIDTH / 2 + targetRadius;
    for (let i = 0; i < this.arms.length; i++) {
      if (!this.arms[i].alive) continue;
      const beam = this.getBeamSegment(i);
      if (this.distancePointToSegmentSq(targetX, targetY, beam.sx, beam.sy, beam.ex, beam.ey) <= halfWidth * halfWidth) {
        return true;
      }
    }
    return false;
  }

  getCollidingHardpointIndex(targetX: number, targetY: number, targetRadius: number): number | null {
    if (!this.active || this.isCoreExposed() || !this.entryComplete) {
      return null;
    }
    for (let i = 0; i < this.arms.length; i++) {
      if (!this.arms[i].alive) continue;
      const pos = this.getHardpointPosition(i);
      const dist = Phaser.Math.Distance.Between(targetX, targetY, pos.x, pos.y);
      if (dist <= BEAM_LATTICE_HARDPOINT_RADIUS + targetRadius + 2) {
        return i;
      }
    }
    return null;
  }

  destroyHardpoint(index: number): BossDropData | null {
    if (!this.active || !this.arms[index]?.alive) {
      return null;
    }
    this.arms[index].alive = false;
    this.coreEntryPrimed = false;
    const pos = this.getHardpointPosition(index);
    return {
      x: pos.x,
      y: pos.y,
      vx: (pos.x - this.x) * 0.6,
      vy: (pos.y - this.y) * 0.6,
    };
  }

  isCoreExposed(): boolean {
    return this.active && this.entryComplete && this.getAliveArmCount() === 0;
  }

  checkCoreContact(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.isCoreExposed()) return false;
    const dist = Phaser.Math.Distance.Between(targetX, targetY, this.x, this.y);
    return dist <= BEAM_LATTICE_CORE_OUTER_RADIUS + targetRadius;
  }

  updateCoreBreach(playerX: number, playerY: number, playerRadius: number, hasShield: boolean): boolean {
    if (!this.isCoreExposed()) return false;
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const enteredCore = dist <= BEAM_LATTICE_CORE_INNER_RADIUS + playerRadius + 4;

    if (!hasShield) {
      this.coreEntryPrimed = false;
      return false;
    }
    if (enteredCore) {
      this.active = false;
      this.coreEntryPrimed = false;
      return true;
    }
    return false;
  }

  getCenter(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getDestructionPlan(): BossDestructionPlan {
    const tangent = { x: Math.cos(this.rotation), y: Math.sin(this.rotation) };
    const inward = { x: -tangent.y, y: tangent.x };
    return { center: { x: this.x, y: this.y }, inward, tangent };
  }

  getStatusLabel(): string {
    if (this.isCoreExposed()) {
      return this.coreEntryPrimed ? 'LATTICE // CORE BREACH' : 'LATTICE // CORE EXPOSED';
    }
    if (!this.entryComplete) {
      return 'LATTICE // INBOUND';
    }
    const beams = this.getAliveArmCount();
    if (this.cycleState === 'fire') {
      return `LATTICE // FIRING // BEAMS ${beams}`;
    }
    const remaining = Math.max(0, BEAM_LATTICE_COOLDOWN_MS - this.cycleMs);
    if (remaining <= BEAM_LATTICE_CHARGE_TELEGRAPH_MS) {
      return `LATTICE // CHARGING // BEAMS ${beams}`;
    }
    return `LATTICE // COOLDOWN // BEAMS ${beams}`;
  }

  getStatusColor(): number {
    if (this.isCoreExposed()) return COLORS.GATE;
    if (this.cycleState === 'fire') return COLORS.ENEMY;
    const remaining = Math.max(0, BEAM_LATTICE_COOLDOWN_MS - this.cycleMs);
    if (remaining <= BEAM_LATTICE_CHARGE_TELEGRAPH_MS) return COLORS.ENEMY;
    return COLORS.HUD;
  }

  getSalvageMultiplier(targetX: number, targetY: number): number {
    if (!this.active || !this.entryComplete || this.isCoreExposed()) {
      return 1;
    }
    if (this.getAliveArmCount() === 0 || this.cycleState !== 'fire') return 1;
    const dist = Phaser.Math.Distance.Between(targetX, targetY, this.x, this.y);
    if (dist >= BEAM_LATTICE_DANGER_INNER && dist <= BEAM_LATTICE_DANGER_OUTER) {
      return BEAM_LATTICE_SALVAGE_MULTIPLIER;
    }
    return 1;
  }

  destroy(): void {
    this.graphic.destroy();
  }

  private getAliveArmCount(): number {
    return this.arms.filter((a) => a.alive).length;
  }

  private getHardpointPosition(index: number): { x: number; y: number } {
    const angle = this.arms[index].baseAngle + this.rotation;
    return {
      x: this.x + Math.cos(angle) * BEAM_LATTICE_HARDPOINT_ORBIT_RADIUS,
      y: this.y + Math.sin(angle) * BEAM_LATTICE_HARDPOINT_ORBIT_RADIUS,
    };
  }

  private getBeamSegment(index: number): BeamSegment {
    const layout = getLayout();
    const angle = this.arms[index].baseAngle + this.rotation;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const distanceToViewEdge = Math.min(
      dx > 0 ? (layout.gameWidth - this.x) / dx : dx < 0 ? -this.x / dx : Number.POSITIVE_INFINITY,
      dy > 0 ? (layout.gameHeight - this.y) / dy : dy < 0 ? -this.y / dy : Number.POSITIVE_INFINITY,
    );
    const endDistance = Math.max(
      BEAM_LATTICE_BODY_RADIUS,
      distanceToViewEdge + BEAM_LATTICE_VIEW_OVERSHOOT,
    );

    return {
      sx: this.x + dx * BEAM_LATTICE_BODY_RADIUS,
      sy: this.y + dy * BEAM_LATTICE_BODY_RADIUS,
      ex: this.x + dx * endDistance,
      ey: this.y + dy * endDistance,
    };
  }

  private distancePointToSegmentSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 0) {
      const ex = px - x1;
      const ey = py - y1;
      return ex * ex + ey * ey;
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Phaser.Math.Clamp(t, 0, 1);
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const ex = px - cx;
    const ey = py - cy;
    return ex * ex + ey * ey;
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    if (!this.active) return;

    const hullColor = COLORS.ENEMY;

    // Danger ring — visible during fire window, hints at salvage multiplier zone
    if (this.entryComplete && this.getAliveArmCount() > 0 && this.cycleState === 'fire') {
      g.lineStyle(1.1, COLORS.SALVAGE, 0.22 + Math.sin(this.pulse * 0.7) * 0.06);
      g.strokeCircle(this.x, this.y, BEAM_LATTICE_DANGER_INNER);
      g.strokeCircle(this.x, this.y, BEAM_LATTICE_DANGER_OUTER);
    }

    const cooldownRemaining = Math.max(0, BEAM_LATTICE_COOLDOWN_MS - this.cycleMs);
    const charging = this.cycleState === 'cooldown' && cooldownRemaining <= BEAM_LATTICE_CHARGE_TELEGRAPH_MS;
    const chargeProgress = charging
      ? Phaser.Math.Clamp(1 - cooldownRemaining / BEAM_LATTICE_CHARGE_TELEGRAPH_MS, 0, 1)
      : 0;
    const fireProgress = this.cycleState === 'fire'
      ? Phaser.Math.Clamp(this.cycleMs / BEAM_LATTICE_FIRE_MS, 0, 1)
      : 0;
    const fireFade = this.cycleState === 'fire' && fireProgress > 0.85
      ? 1 - (fireProgress - 0.85) / 0.15
      : 1;

    // Beams — only during fire (full lethal) or last telegraph slice of cooldown (charge ramp)
    if (this.entryComplete && (this.cycleState === 'fire' || charging)) {
      for (let i = 0; i < this.arms.length; i++) {
        if (!this.arms[i].alive) continue;
        const { sx, sy, ex, ey } = this.getBeamSegment(i);

        if (charging) {
          // Telegraph: thin flickering line, no fill
          const flicker = 0.3 + Math.sin(this.pulse * 2 + i * 0.7) * 0.18;
          g.lineStyle(2.2, hullColor, flicker * (0.4 + chargeProgress * 0.5));
          const tipX = sx + (ex - sx) * (0.25 + chargeProgress * 0.7);
          const tipY = sy + (ey - sy) * (0.25 + chargeProgress * 0.7);
          g.lineBetween(sx, sy, tipX, tipY);
          continue;
        }

        // Outer glow
        g.lineStyle(BEAM_LATTICE_BEAM_WIDTH * 2.2, hullColor, (0.12 + Math.sin(this.pulse + i) * 0.04) * fireFade);
        g.lineBetween(sx, sy, ex, ey);
        // Core beam
        g.lineStyle(BEAM_LATTICE_BEAM_WIDTH, hullColor, 0.82 * fireFade);
        g.lineBetween(sx, sy, ex, ey);
        // Hot center
        g.lineStyle(Math.max(2, BEAM_LATTICE_BEAM_WIDTH * 0.24), 0xffffff, 0.58 * fireFade);
        g.lineBetween(sx, sy, ex, ey);
      }
    }

    // Body
    g.fillStyle(COLORS.BG, 0.96);
    g.fillCircle(this.x, this.y, BEAM_LATTICE_BODY_RADIUS);
    g.lineStyle(2, hullColor, 0.86);
    g.strokeCircle(this.x, this.y, BEAM_LATTICE_BODY_RADIUS);
    g.lineStyle(1.1, hullColor, 0.36);
    g.strokeCircle(this.x, this.y, BEAM_LATTICE_BODY_RADIUS * 0.62);
    // Inner spin tick
    const tickAngle = this.rotation;
    g.lineStyle(1.4, hullColor, 0.6);
    g.lineBetween(
      this.x + Math.cos(tickAngle) * BEAM_LATTICE_BODY_RADIUS * 0.18,
      this.y + Math.sin(tickAngle) * BEAM_LATTICE_BODY_RADIUS * 0.18,
      this.x + Math.cos(tickAngle) * BEAM_LATTICE_BODY_RADIUS * 0.78,
      this.y + Math.sin(tickAngle) * BEAM_LATTICE_BODY_RADIUS * 0.78,
    );

    // Hardpoints
    for (let i = 0; i < this.arms.length; i++) {
      const pos = this.getHardpointPosition(i);
      if (!this.arms[i].alive) {
        g.lineStyle(1.1, hullColor, 0.3);
        g.strokeCircle(pos.x, pos.y, BEAM_LATTICE_HARDPOINT_RADIUS * 0.8);
        continue;
      }
      g.fillStyle(COLORS.BG, 0.94);
      g.lineStyle(1.6, hullColor, 0.96);
      g.fillCircle(pos.x, pos.y, BEAM_LATTICE_HARDPOINT_RADIUS);
      g.strokeCircle(pos.x, pos.y, BEAM_LATTICE_HARDPOINT_RADIUS);
      g.lineStyle(1.3, hullColor, 0.4 + Math.sin(this.pulse + i * 0.7) * 0.16);
      g.strokeCircle(pos.x, pos.y, BEAM_LATTICE_HARDPOINT_RADIUS * 0.66);
      g.fillStyle(hullColor, 0.5);
      g.fillCircle(pos.x, pos.y, BEAM_LATTICE_HARDPOINT_RADIUS * 0.2);
    }

    if (this.isCoreExposed()) {
      this.drawExposedCore(g);
    }
  }

  private drawExposedCore(g: Phaser.GameObjects.Graphics): void {
    const pulse = 0.14 + Math.sin(this.corePulse) * 0.06;
    const reticleRadius = BEAM_LATTICE_CORE_OUTER_RADIUS + 9 + Math.sin(this.corePulse * 1.4) * 3;
    g.fillStyle(COLORS.GATE, 0.1 + pulse);
    g.fillCircle(this.x, this.y, BEAM_LATTICE_CORE_OUTER_RADIUS);
    g.lineStyle(1.2, COLORS.BG, 0.86);
    g.strokeCircle(this.x, this.y, reticleRadius + 1.5);
    g.lineStyle(1.5, COLORS.GATE, 0.62 + pulse);
    g.strokeCircle(this.x, this.y, reticleRadius);
    for (let i = 0; i < 4; i++) {
      const angle = this.corePulse * 0.5 + i * (Math.PI / 2);
      const inner = BEAM_LATTICE_CORE_OUTER_RADIUS + 5;
      const outer = BEAM_LATTICE_CORE_OUTER_RADIUS + 16;
      g.lineStyle(2, COLORS.GATE, 0.68);
      g.lineBetween(
        this.x + Math.cos(angle) * inner,
        this.y + Math.sin(angle) * inner,
        this.x + Math.cos(angle) * outer,
        this.y + Math.sin(angle) * outer,
      );
    }
    g.lineStyle(2.1, COLORS.GATE, this.coreEntryPrimed ? 1 : 0.88);
    g.strokeCircle(this.x, this.y, BEAM_LATTICE_CORE_OUTER_RADIUS);
    g.lineStyle(1.25, 0xffffff, 0.56);
    g.strokeCircle(this.x, this.y, BEAM_LATTICE_CORE_INNER_RADIUS);
    g.fillStyle(COLORS.BG, 0.94);
    g.fillCircle(this.x, this.y, BEAM_LATTICE_CORE_INNER_RADIUS - 3);
    const spin = this.corePulse * 0.7;
    const deviceRadius = BEAM_LATTICE_CORE_INNER_RADIUS * 0.62;
    g.fillStyle(COLORS.GATE, 0.2);
    g.lineStyle(1.6, COLORS.GATE, 0.95);
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = spin + i * (Math.PI / 2);
      const px = this.x + Math.cos(a) * deviceRadius;
      const py = this.y + Math.sin(a) * deviceRadius;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(1.1, 0xffffff, 0.78);
    g.strokeCircle(this.x, this.y, BEAM_LATTICE_CORE_INNER_RADIUS * 0.28);
    g.fillStyle(0xffffff, 0.72);
    g.fillCircle(this.x, this.y, BEAM_LATTICE_CORE_INNER_RADIUS * 0.12);
  }
}
