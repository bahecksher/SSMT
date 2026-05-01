import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  SINGULARITY_BODY_RADIUS,
  SINGULARITY_CORE_INNER_RADIUS,
  SINGULARITY_CORE_OUTER_RADIUS,
  SINGULARITY_DRIFT_SPEED,
  SINGULARITY_HARDPOINT_COUNT,
  SINGULARITY_HARDPOINT_ORBIT_RADIUS,
  SINGULARITY_HARDPOINT_RADIUS,
  SINGULARITY_HARDPOINT_SPIN_SPEED,
  SINGULARITY_PULL_ACCEL,
  SINGULARITY_PULL_MS,
  SINGULARITY_PULL_RADIUS,
  SINGULARITY_REPULSE_ACCEL,
  SINGULARITY_REPULSE_MS,
  SINGULARITY_REPULSE_RADIUS,
  SINGULARITY_VULNERABLE_MS,
  SINGULARITY_WARNING_MS,
} from '../data/tuning';
import { getLayout } from '../layout';
import type { BossDestructionPlan, BossDropData, BossEntity, BossForceImpulse, BossVentDrop } from './BossEntity';

type SingularityState = 'entry' | 'warning' | 'pull' | 'repulse' | 'vulnerable';

interface HardpointState {
  baseAngle: number;
  alive: boolean;
}

const ENTRY_DRIFT_OFFSET = SINGULARITY_BODY_RADIUS * 4 + 96;

export class SingularityBoss implements BossEntity {
  graphic: Phaser.GameObjects.Graphics;
  active = true;

  private x = 0;
  private y = 0;
  private targetX = 0;
  private targetY = 0;
  private state: SingularityState = 'entry';
  private stateMs = 0;
  private spinAngle = 0;
  private pulse = 0;
  private corePulse = 0;
  private coreEntryPrimed = false;
  private warningPulsePending = false;
  private hardpoints: HardpointState[] = [];

  constructor(scene: Phaser.Scene, hardpointCount = SINGULARITY_HARDPOINT_COUNT) {
    this.graphic = scene.add.graphics().setDepth(6);

    for (let i = 0; i < hardpointCount; i++) {
      this.hardpoints.push({
        baseAngle: (i / hardpointCount) * Math.PI * 2,
        alive: true,
      });
    }

    const layout = getLayout();
    this.targetX = (layout.arenaLeft + layout.arenaRight) / 2;
    this.targetY = (layout.arenaTop + layout.arenaBottom) / 2;
    const entryAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Math.max(layout.arenaWidth, layout.arenaHeight) / 2 + ENTRY_DRIFT_OFFSET;
    this.x = this.targetX + Math.cos(entryAngle) * radius;
    this.y = this.targetY + Math.sin(entryAngle) * radius;

    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    this.spinAngle += delta * 0.001 * SINGULARITY_HARDPOINT_SPIN_SPEED;
    this.pulse += delta * 0.005;
    this.corePulse += delta * 0.0045;
    this.stateMs += delta;

    switch (this.state) {
      case 'entry': {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = SINGULARITY_DRIFT_SPEED * (delta / 1000);
        if (dist <= step + 1) {
          this.x = this.targetX;
          this.y = this.targetY;
          this.transitionTo('warning');
        } else {
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        }
        break;
      }
      case 'warning':
        if (this.stateMs >= SINGULARITY_WARNING_MS) {
          this.transitionTo('pull');
        }
        break;
      case 'pull':
        if (this.stateMs >= SINGULARITY_PULL_MS) {
          this.transitionTo('repulse');
        }
        break;
      case 'repulse':
        if (this.stateMs >= SINGULARITY_REPULSE_MS) {
          this.transitionTo('vulnerable');
        }
        break;
      case 'vulnerable':
        if (this.stateMs >= SINGULARITY_VULNERABLE_MS) {
          // Cycle back to warning if cores still standing
          if (this.getAliveHardpointCount() > 0) {
            this.transitionTo('warning');
          }
        }
        break;
    }

    this.draw();
  }

  consumeWarningPulse(): boolean {
    const pending = this.warningPulsePending;
    this.warningPulsePending = false;
    return pending;
  }

  consumeAsteroidVents(): BossVentDrop[] {
    return [];
  }

  checkBeamHit(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.active || this.state !== 'pull') {
      return false;
    }
    // Body itself is lethal during pull state
    const dist = Phaser.Math.Distance.Between(targetX, targetY, this.x, this.y);
    return dist <= SINGULARITY_BODY_RADIUS + targetRadius;
  }

  getCollidingHardpointIndex(targetX: number, targetY: number, targetRadius: number): number | null {
    if (!this.active || this.isCoreExposed() || this.state !== 'vulnerable') {
      return null;
    }
    for (let i = 0; i < this.hardpoints.length; i++) {
      if (!this.hardpoints[i].alive) continue;
      const pos = this.getHardpointPosition(i);
      const dist = Phaser.Math.Distance.Between(targetX, targetY, pos.x, pos.y);
      if (dist <= SINGULARITY_HARDPOINT_RADIUS + targetRadius + 2) {
        return i;
      }
    }
    return null;
  }

  destroyHardpoint(index: number): BossDropData | null {
    if (!this.active || !this.hardpoints[index]?.alive) {
      return null;
    }
    this.hardpoints[index].alive = false;
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
    return this.active && this.getAliveHardpointCount() === 0;
  }

  checkCoreContact(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }
    const dist = Phaser.Math.Distance.Between(targetX, targetY, this.x, this.y);
    return dist <= SINGULARITY_CORE_OUTER_RADIUS + targetRadius;
  }

  updateCoreBreach(playerX: number, playerY: number, playerRadius: number, hasShield: boolean): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const enteredCore = dist <= SINGULARITY_CORE_INNER_RADIUS + playerRadius + 4;

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
    // Stationary boss — pick an arbitrary axis for the debris field
    const angle = this.spinAngle;
    const tangent = { x: Math.cos(angle), y: Math.sin(angle) };
    const inward = { x: -tangent.y, y: tangent.x };
    return { center: { x: this.x, y: this.y }, inward, tangent };
  }

  getStatusLabel(): string {
    if (this.isCoreExposed()) {
      return this.coreEntryPrimed ? 'SINGULARITY // CORE BREACH' : 'SINGULARITY // CORE EXPOSED';
    }
    const cores = this.getAliveHardpointCount();
    switch (this.state) {
      case 'entry':
        return `SINGULARITY // INBOUND // CORES ${cores}`;
      case 'warning':
        return `SINGULARITY // CHARGING // CORES ${cores}`;
      case 'pull':
        return `SINGULARITY // PULL // CORES ${cores}`;
      case 'repulse':
        return `SINGULARITY // BLOWBACK // CORES ${cores}`;
      case 'vulnerable':
        return `SINGULARITY // CORES OPEN ${cores}`;
    }
  }

  getStatusColor(): number {
    if (this.isCoreExposed() || this.state === 'vulnerable') {
      return COLORS.GATE;
    }
    if (this.state === 'pull' || this.state === 'warning') {
      return COLORS.ENEMY;
    }
    return COLORS.HUD;
  }

  getForceField(targetX: number, targetY: number, _delta: number): BossForceImpulse {
    if (!this.active) {
      return { ax: 0, ay: 0, ix: 0, iy: 0 };
    }

    if (this.state === 'pull') {
      const dx = this.x - targetX;
      const dy = this.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 1 || dist > SINGULARITY_PULL_RADIUS) {
        return { ax: 0, ay: 0, ix: 0, iy: 0 };
      }
      const nx = dx / dist;
      const ny = dy / dist;
      // Falloff: stronger pull as player approaches the core
      const falloff = 1 - dist / SINGULARITY_PULL_RADIUS;
      const accel = SINGULARITY_PULL_ACCEL * (0.55 + falloff * 0.85);
      return { ax: nx * accel, ay: ny * accel, ix: 0, iy: 0 };
    }

    if (this.state === 'repulse') {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 0.0001 || dist > SINGULARITY_REPULSE_RADIUS) {
        return { ax: 0, ay: 0, ix: 0, iy: 0 };
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const falloff = 1 - Math.min(1, dist / SINGULARITY_REPULSE_RADIUS);
      // Sustained outward acceleration over the repulse window
      const accel = SINGULARITY_REPULSE_ACCEL * (0.55 + falloff * 0.85);
      return { ax: nx * accel, ay: ny * accel, ix: 0, iy: 0 };
    }

    return { ax: 0, ay: 0, ix: 0, iy: 0 };
  }

  destroy(): void {
    this.graphic.destroy();
  }

  private getAliveHardpointCount(): number {
    return this.hardpoints.filter((h) => h.alive).length;
  }

  private transitionTo(state: SingularityState): void {
    this.state = state;
    this.stateMs = 0;
    if (state === 'warning' || state === 'pull') {
      this.warningPulsePending = true;
    }
  }

  private getHardpointPosition(index: number): { x: number; y: number } {
    const angle = this.hardpoints[index].baseAngle + this.spinAngle;
    return {
      x: this.x + Math.cos(angle) * SINGULARITY_HARDPOINT_ORBIT_RADIUS,
      y: this.y + Math.sin(angle) * SINGULARITY_HARDPOINT_ORBIT_RADIUS,
    };
  }

  private getStateProgress(): number {
    switch (this.state) {
      case 'warning': return Phaser.Math.Clamp(this.stateMs / SINGULARITY_WARNING_MS, 0, 1);
      case 'pull': return Phaser.Math.Clamp(this.stateMs / SINGULARITY_PULL_MS, 0, 1);
      case 'repulse': return Phaser.Math.Clamp(this.stateMs / SINGULARITY_REPULSE_MS, 0, 1);
      case 'vulnerable': return Phaser.Math.Clamp(this.stateMs / SINGULARITY_VULNERABLE_MS, 0, 1);
      default: return 0;
    }
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    if (!this.active) return;

    const hullColor = COLORS.ENEMY;

    // Pull telegraph rings: contracting toward core during warning, holding during pull
    if (this.state === 'warning' || this.state === 'pull') {
      const progress = this.getStateProgress();
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const phase = (this.pulse * 0.6 + r / ringCount + progress * 0.5) % 1;
        const ringRadius = SINGULARITY_PULL_RADIUS * (1 - phase);
        const alpha = 0.06 + (1 - phase) * (this.state === 'pull' ? 0.34 : 0.18);
        g.lineStyle(1.4, hullColor, alpha);
        g.strokeCircle(this.x, this.y, ringRadius);
      }
    }

    // Repulse shock ring
    if (this.state === 'repulse') {
      const progress = this.getStateProgress();
      const shockRadius = progress * SINGULARITY_REPULSE_RADIUS;
      g.lineStyle(3, COLORS.GATE, 0.8 * (1 - progress));
      g.strokeCircle(this.x, this.y, shockRadius);
      g.lineStyle(1.4, COLORS.GATE, 0.4 * (1 - progress));
      g.strokeCircle(this.x, this.y, shockRadius * 0.7);
    }

    // Body — dark disc with a bright accretion ring
    const bodyRadius = SINGULARITY_BODY_RADIUS;
    g.fillStyle(COLORS.BG, 0.96);
    g.fillCircle(this.x, this.y, bodyRadius);
    g.lineStyle(2.2, hullColor, this.state === 'pull' ? 0.95 : 0.62);
    g.strokeCircle(this.x, this.y, bodyRadius);

    // Spinning accretion arcs
    for (let i = 0; i < 5; i++) {
      const a0 = this.spinAngle * 2 + i * (Math.PI * 0.4);
      const a1 = a0 + 0.55;
      const r = bodyRadius + 6 + (i % 2) * 4;
      g.lineStyle(1.4, hullColor, 0.42 + Math.sin(this.pulse + i) * 0.12);
      g.beginPath();
      g.arc(this.x, this.y, r, a0, a1, false);
      g.strokePath();
    }

    // Hardpoints
    const cores = this.hardpoints;
    for (let i = 0; i < cores.length; i++) {
      const pos = this.getHardpointPosition(i);
      if (!cores[i].alive) {
        g.lineStyle(1.1, hullColor, 0.3);
        g.strokeCircle(pos.x, pos.y, SINGULARITY_HARDPOINT_RADIUS * 0.8);
        continue;
      }
      const open = this.state === 'vulnerable';
      const ringColor = open ? COLORS.GATE : hullColor;
      g.fillStyle(COLORS.BG, 0.94);
      g.lineStyle(1.6, ringColor, open ? 0.95 : 0.62);
      g.fillCircle(pos.x, pos.y, SINGULARITY_HARDPOINT_RADIUS);
      g.strokeCircle(pos.x, pos.y, SINGULARITY_HARDPOINT_RADIUS);
      // Inner pulse — glows only when cores are open
      const pulseAlpha = open ? 0.55 + Math.sin(this.pulse + i * 0.7) * 0.2 : 0.18;
      g.lineStyle(1.3, ringColor, pulseAlpha);
      g.strokeCircle(pos.x, pos.y, SINGULARITY_HARDPOINT_RADIUS * 0.62);
      g.fillStyle(ringColor, open ? 0.8 : 0.35);
      g.fillCircle(pos.x, pos.y, SINGULARITY_HARDPOINT_RADIUS * 0.22);
    }

    // Tether lines from body to alive hardpoints when cores open (visual cue)
    if (this.state === 'vulnerable') {
      g.lineStyle(1.1, COLORS.GATE, 0.36);
      for (let i = 0; i < cores.length; i++) {
        if (!cores[i].alive) continue;
        const pos = this.getHardpointPosition(i);
        g.lineBetween(this.x, this.y, pos.x, pos.y);
      }
    }

    if (this.isCoreExposed()) {
      this.drawExposedCore(g);
    }
  }

  private drawExposedCore(g: Phaser.GameObjects.Graphics): void {
    const pulse = 0.14 + Math.sin(this.corePulse) * 0.06;
    const reticleRadius = SINGULARITY_CORE_OUTER_RADIUS + 9 + Math.sin(this.corePulse * 1.4) * 3;
    g.fillStyle(COLORS.GATE, 0.1 + pulse);
    g.fillCircle(this.x, this.y, SINGULARITY_CORE_OUTER_RADIUS);
    g.lineStyle(1.2, COLORS.BG, 0.86);
    g.strokeCircle(this.x, this.y, reticleRadius + 1.5);
    g.lineStyle(1.5, COLORS.GATE, 0.62 + pulse);
    g.strokeCircle(this.x, this.y, reticleRadius);
    for (let i = 0; i < 4; i++) {
      const angle = this.corePulse * 0.5 + i * (Math.PI / 2);
      const inner = SINGULARITY_CORE_OUTER_RADIUS + 5;
      const outer = SINGULARITY_CORE_OUTER_RADIUS + 16;
      g.lineStyle(2, COLORS.GATE, 0.68);
      g.lineBetween(
        this.x + Math.cos(angle) * inner,
        this.y + Math.sin(angle) * inner,
        this.x + Math.cos(angle) * outer,
        this.y + Math.sin(angle) * outer,
      );
    }
    g.lineStyle(2.1, COLORS.GATE, this.coreEntryPrimed ? 1 : 0.88);
    g.strokeCircle(this.x, this.y, SINGULARITY_CORE_OUTER_RADIUS);
    g.lineStyle(1.25, 0xffffff, 0.56);
    g.strokeCircle(this.x, this.y, SINGULARITY_CORE_INNER_RADIUS);
    g.fillStyle(COLORS.BG, 0.94);
    g.fillCircle(this.x, this.y, SINGULARITY_CORE_INNER_RADIUS - 3);
    // Core device
    const spin = this.corePulse * 0.7;
    const deviceRadius = SINGULARITY_CORE_INNER_RADIUS * 0.62;
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
    g.strokeCircle(this.x, this.y, SINGULARITY_CORE_INNER_RADIUS * 0.28);
    g.fillStyle(0xffffff, 0.72);
    g.fillCircle(this.x, this.y, SINGULARITY_CORE_INNER_RADIUS * 0.12);
  }
}
