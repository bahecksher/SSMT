import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  SLAG_HAULER_BODY_HALF_LENGTH,
  SLAG_HAULER_BODY_SPEED,
  SLAG_HAULER_BODY_THICKNESS,
  SLAG_HAULER_CORE_INNER_RADIUS,
  SLAG_HAULER_CORE_OUTER_RADIUS,
  SLAG_HAULER_SEGMENT_COUNT,
  SLAG_HAULER_SEGMENT_RADIUS,
  SLAG_HAULER_VENT_CHARGE_MS,
  SLAG_HAULER_VENT_INTERVAL_MAX_MS,
  SLAG_HAULER_VENT_INTERVAL_MIN_MS,
  SLAG_HAULER_VENT_SIZE_MAX,
  SLAG_HAULER_VENT_SIZE_MIN,
  SLAG_HAULER_VENT_SPEED_MAX,
  SLAG_HAULER_VENT_SPEED_MIN,
} from '../data/tuning';
import { getLayout } from '../layout';
import type { BossDestructionPlan, BossDropData, BossEntity, BossVentDrop } from './BossEntity';

interface SegmentState {
  offset: number;
  alive: boolean;
  ventTimerMs: number;
  nextVentMs: number;
  chargeSide: -1 | 0 | 1;
}

interface LocalPoint {
  x: number;
  y: number;
}

const PASS_OVERSCAN = SLAG_HAULER_BODY_HALF_LENGTH + SLAG_HAULER_BODY_THICKNESS + 96;

export class SlagHauler implements BossEntity {
  graphic: Phaser.GameObjects.Graphics;
  active = true;

  private x = 0;
  private y = 0;
  private headingX = 1;
  private headingY = 0;
  private bodyPulse = 0;
  private corePulse = 0;
  private coreEntryPrimed = false;
  private segments: SegmentState[] = [];
  private pendingVents: BossVentDrop[] = [];

  constructor(scene: Phaser.Scene, segmentCount = SLAG_HAULER_SEGMENT_COUNT) {
    this.graphic = scene.add.graphics().setDepth(6);

    const usableSpan = SLAG_HAULER_BODY_HALF_LENGTH * 1.55;
    const offsetStart = segmentCount === 1 ? 0 : -usableSpan / 2;
    const offsetStep = segmentCount <= 1 ? 0 : usableSpan / (segmentCount - 1);
    for (let i = 0; i < segmentCount; i++) {
      this.segments.push({
        offset: offsetStart + offsetStep * i,
        alive: true,
        ventTimerMs: 0,
        nextVentMs: Phaser.Math.Between(SLAG_HAULER_VENT_INTERVAL_MIN_MS, SLAG_HAULER_VENT_INTERVAL_MAX_MS),
        chargeSide: 0,
      });
    }

    this.beginPass();
    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    this.bodyPulse += delta * 0.0035;
    this.corePulse += delta * 0.0045;

    this.x += this.headingX * SLAG_HAULER_BODY_SPEED * (delta / 1000);
    this.y += this.headingY * SLAG_HAULER_BODY_SPEED * (delta / 1000);

    if (this.isOutOfArena()) {
      this.beginPass();
    }

    if (!this.isCoreExposed()) {
      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        if (!seg.alive) continue;
        seg.ventTimerMs += delta;
        const remainingMs = seg.nextVentMs - seg.ventTimerMs;
        if (seg.chargeSide === 0 && remainingMs <= SLAG_HAULER_VENT_CHARGE_MS) {
          seg.chargeSide = Math.random() < 0.5 ? -1 : 1;
        }
        if (seg.ventTimerMs >= seg.nextVentMs) {
          const side = seg.chargeSide === 0 ? (Math.random() < 0.5 ? -1 : 1) : seg.chargeSide;
          this.queueVent(i, side);
          seg.ventTimerMs = 0;
          seg.nextVentMs = Phaser.Math.Between(SLAG_HAULER_VENT_INTERVAL_MIN_MS, SLAG_HAULER_VENT_INTERVAL_MAX_MS);
          seg.chargeSide = 0;
        }
      }
    }

    this.draw();
  }

  consumeWarningPulse(): boolean {
    return false;
  }

  consumeAsteroidVents(): BossVentDrop[] {
    if (this.pendingVents.length === 0) return [];
    const drops = this.pendingVents;
    this.pendingVents = [];
    return drops;
  }

  checkBeamHit(): boolean {
    return false;
  }

  getCollidingHardpointIndex(targetX: number, targetY: number, targetRadius: number): number | null {
    if (!this.active || this.isCoreExposed()) {
      return null;
    }

    for (let i = 0; i < this.segments.length; i++) {
      if (!this.segments[i].alive) continue;
      const segPos = this.getSegmentPosition(i);
      const dist = Phaser.Math.Distance.Between(targetX, targetY, segPos.x, segPos.y);
      if (dist <= SLAG_HAULER_SEGMENT_RADIUS + targetRadius + 2) {
        return i;
      }
    }

    return null;
  }

  destroyHardpoint(index: number): BossDropData | null {
    if (!this.active || !this.segments[index]?.alive) {
      return null;
    }

    this.segments[index].alive = false;
    this.coreEntryPrimed = false;
    const segPos = this.getSegmentPosition(index);
    return {
      x: segPos.x,
      y: segPos.y,
      vx: this.headingX * SLAG_HAULER_BODY_SPEED * 0.4,
      vy: this.headingY * SLAG_HAULER_BODY_SPEED * 0.4,
    };
  }

  isCoreExposed(): boolean {
    return this.active && this.getAliveSegmentCount() === 0;
  }

  checkCoreContact(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }

    const coreCenter = this.getCoreCenter();
    return Phaser.Math.Distance.Between(targetX, targetY, coreCenter.x, coreCenter.y) <= SLAG_HAULER_CORE_OUTER_RADIUS + targetRadius;
  }

  updateCoreBreach(playerX: number, playerY: number, playerRadius: number, hasShield: boolean): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }

    const coreCenter = this.getCoreCenter();
    const dist = Phaser.Math.Distance.Between(playerX, playerY, coreCenter.x, coreCenter.y);
    const enteredCore = dist <= SLAG_HAULER_CORE_INNER_RADIUS + playerRadius + 4;

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
    const tangent = { x: this.headingX, y: this.headingY };
    const inward = { x: -tangent.y, y: tangent.x };
    return { center: { x: this.x, y: this.y }, inward, tangent };
  }

  getStatusLabel(): string {
    if (this.isCoreExposed()) {
      return this.coreEntryPrimed ? 'HAULER // CORE BREACH' : 'HAULER // CORE EXPOSED';
    }
    const alive = this.getAliveSegmentCount();
    return `HAULER // SEGMENTS ${alive}`;
  }

  getStatusColor(): number {
    if (this.isCoreExposed()) {
      return COLORS.GATE;
    }
    return COLORS.ENEMY;
  }

  destroy(): void {
    this.graphic.destroy();
  }

  private getAliveSegmentCount(): number {
    return this.segments.filter((s) => s.alive).length;
  }

  private beginPass(): void {
    const layout = getLayout();
    const cx = (layout.arenaLeft + layout.arenaRight) / 2;
    const cy = (layout.arenaTop + layout.arenaBottom) / 2;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.headingX = Math.cos(angle);
    this.headingY = Math.sin(angle);

    const arenaHalfWidth = (layout.arenaRight - layout.arenaLeft) / 2;
    const arenaHalfHeight = (layout.arenaBottom - layout.arenaTop) / 2;
    const radius = Math.max(arenaHalfWidth, arenaHalfHeight) + PASS_OVERSCAN;

    this.x = cx - this.headingX * radius;
    this.y = cy - this.headingY * radius;
    this.coreEntryPrimed = false;
  }

  private isOutOfArena(): boolean {
    const layout = getLayout();
    return (
      this.x < layout.arenaLeft - PASS_OVERSCAN ||
      this.x > layout.arenaRight + PASS_OVERSCAN ||
      this.y < layout.arenaTop - PASS_OVERSCAN ||
      this.y > layout.arenaBottom + PASS_OVERSCAN
    );
  }

  private getOrientationVectors(): { tangent: LocalPoint; inward: LocalPoint } {
    const tangent = { x: this.headingX, y: this.headingY };
    const inward = { x: -tangent.y, y: tangent.x };
    return { tangent, inward };
  }

  private toWorldPoint(localX: number, localY: number): LocalPoint {
    const { tangent, inward } = this.getOrientationVectors();
    return {
      x: this.x + tangent.x * localX + inward.x * localY,
      y: this.y + tangent.y * localX + inward.y * localY,
    };
  }

  private getSegmentPosition(index: number): { x: number; y: number } {
    const offset = this.segments[index]?.offset ?? 0;
    return this.toWorldPoint(offset, 0);
  }

  private getCoreCenter(): { x: number; y: number } {
    return this.toWorldPoint(0, 0);
  }

  private queueVent(segmentIndex: number, side: -1 | 1): void {
    const segPos = this.getSegmentPosition(segmentIndex);
    const { inward } = this.getOrientationVectors();
    const speed = Phaser.Math.FloatBetween(SLAG_HAULER_VENT_SPEED_MIN, SLAG_HAULER_VENT_SPEED_MAX);
    const sizeScale = Phaser.Math.FloatBetween(SLAG_HAULER_VENT_SIZE_MIN, SLAG_HAULER_VENT_SIZE_MAX);
    const exitX = segPos.x + inward.x * side * (SLAG_HAULER_BODY_THICKNESS * 0.6);
    const exitY = segPos.y + inward.y * side * (SLAG_HAULER_BODY_THICKNESS * 0.6);
    this.pendingVents.push({
      x: exitX,
      y: exitY,
      vx: inward.x * side * speed,
      vy: inward.y * side * speed,
      sizeScale,
      mineable: Math.random() < 0.45,
    });
  }

  private getHullPoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 1.04, y: -halfThickness * 0.5 },
      { x: -halfLength * 0.74, y: -halfThickness * 1.0 },
      { x: -halfLength * 0.34, y: -halfThickness * 1.06 },
      { x: halfLength * 0.34, y: -halfThickness * 1.06 },
      { x: halfLength * 0.74, y: -halfThickness * 1.0 },
      { x: halfLength * 1.04, y: -halfThickness * 0.5 },
      { x: halfLength * 1.18, y: 0 },
      { x: halfLength * 1.04, y: halfThickness * 0.5 },
      { x: halfLength * 0.74, y: halfThickness * 1.0 },
      { x: halfLength * 0.34, y: halfThickness * 1.06 },
      { x: -halfLength * 0.34, y: halfThickness * 1.06 },
      { x: -halfLength * 0.74, y: halfThickness * 1.0 },
      { x: -halfLength * 1.04, y: halfThickness * 0.5 },
      { x: -halfLength * 1.18, y: 0 },
    ];
  }

  private getInnerHullPoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 0.92, y: -halfThickness * 0.42 },
      { x: -halfLength * 0.6, y: -halfThickness * 0.78 },
      { x: halfLength * 0.6, y: -halfThickness * 0.78 },
      { x: halfLength * 0.92, y: -halfThickness * 0.42 },
      { x: halfLength * 0.92, y: halfThickness * 0.42 },
      { x: halfLength * 0.6, y: halfThickness * 0.78 },
      { x: -halfLength * 0.6, y: halfThickness * 0.78 },
      { x: -halfLength * 0.92, y: halfThickness * 0.42 },
    ];
  }

  private drawVentTelegraph(
    g: Phaser.GameObjects.Graphics,
    segX: number,
    segY: number,
    inward: LocalPoint,
    side: -1 | 1,
    remainingMs: number,
  ): void {
    const charge = SLAG_HAULER_VENT_CHARGE_MS;
    const progress = Phaser.Math.Clamp(1 - remainingMs / charge, 0, 1);
    const sideX = inward.x * side;
    const sideY = inward.y * side;
    const maxDist = SLAG_HAULER_BODY_THICKNESS * 1.2;
    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      const phase = (progress + r / ringCount) % 1;
      // Rings start far out on the vent side and converge inward toward the segment
      const dist = maxDist * (1 - phase);
      const cx = segX + sideX * dist;
      const cy = segY + sideY * dist;
      const ringRadius = SLAG_HAULER_SEGMENT_RADIUS * (0.4 + phase * 0.45);
      const alpha = 0.2 + (1 - phase) * 0.55 * progress;
      g.lineStyle(1.4, COLORS.HAZARD, alpha);
      g.strokeCircle(cx, cy, ringRadius);
    }
    // Bright cap on the segment edge facing the vent direction
    const capX = segX + sideX * SLAG_HAULER_SEGMENT_RADIUS * 0.95;
    const capY = segY + sideY * SLAG_HAULER_SEGMENT_RADIUS * 0.95;
    g.fillStyle(COLORS.HAZARD, 0.4 + progress * 0.45);
    g.fillCircle(capX, capY, SLAG_HAULER_SEGMENT_RADIUS * (0.18 + progress * 0.18));
  }

  private drawLocalPolygon(
    g: Phaser.GameObjects.Graphics,
    localPoints: LocalPoint[],
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
    lineWidth: number,
  ): void {
    const worldPoints = localPoints.map((point) => this.toWorldPoint(point.x, point.y));
    g.lineStyle(lineWidth, strokeColor, strokeAlpha);
    if (fillAlpha > 0) {
      g.fillStyle(fillColor, fillAlpha);
    }
    g.beginPath();
    g.moveTo(worldPoints[0].x, worldPoints[0].y);
    for (let i = 1; i < worldPoints.length; i++) {
      g.lineTo(worldPoints[i].x, worldPoints[i].y);
    }
    g.closePath();
    if (fillAlpha > 0) {
      g.fillPath();
    }
    g.strokePath();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    if (!this.active) {
      return;
    }

    const hullColor = COLORS.ENEMY;
    const halfLength = SLAG_HAULER_BODY_HALF_LENGTH;
    const halfThickness = SLAG_HAULER_BODY_THICKNESS / 2;
    const hullPoints = this.getHullPoints(halfLength, halfThickness);
    const innerHullPoints = this.getInnerHullPoints(halfLength, halfThickness);

    this.drawLocalPolygon(g, hullPoints, hullColor, 0.08, hullColor, 0.32, 1.2);
    this.drawLocalPolygon(g, innerHullPoints, COLORS.BG, 0.92, hullColor, 0.86, 1.4);
    this.drawLocalPolygon(g, innerHullPoints, hullColor, 0.06, hullColor, 0.18, 0.7);

    // Spine line through segment offsets
    const spineStart = this.toWorldPoint(-halfLength, 0);
    const spineEnd = this.toWorldPoint(halfLength, 0);
    g.lineStyle(1.0, hullColor, 0.34);
    g.lineBetween(spineStart.x, spineStart.y, spineEnd.x, spineEnd.y);

    const { inward: inwardVec } = this.getOrientationVectors();
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const segPos = this.getSegmentPosition(i);
      if (seg.alive) {
        const ventReady = seg.ventTimerMs / Math.max(1, seg.nextVentMs);
        g.fillStyle(COLORS.BG, 0.94);
        g.lineStyle(1.6, hullColor, 0.96);
        g.fillCircle(segPos.x, segPos.y, SLAG_HAULER_SEGMENT_RADIUS);
        g.strokeCircle(segPos.x, segPos.y, SLAG_HAULER_SEGMENT_RADIUS);
        // Inner pulse ramps up as next vent approaches
        const pulseAlpha = 0.3 + Math.min(0.6, ventReady * 0.7) + Math.sin(this.bodyPulse + i * 0.6) * 0.08;
        g.lineStyle(1.3, hullColor, pulseAlpha);
        g.strokeCircle(segPos.x, segPos.y, SLAG_HAULER_SEGMENT_RADIUS * 0.66);
        // Mineable-style core dot
        g.fillStyle(hullColor, 0.5);
        g.fillCircle(segPos.x, segPos.y, SLAG_HAULER_SEGMENT_RADIUS * 0.18);

        if (seg.chargeSide !== 0) {
          this.drawVentTelegraph(g, segPos.x, segPos.y, inwardVec, seg.chargeSide, seg.nextVentMs - seg.ventTimerMs);
        }
      } else {
        g.lineStyle(1.1, hullColor, 0.3);
        g.strokeCircle(segPos.x, segPos.y, SLAG_HAULER_SEGMENT_RADIUS * 0.78);
      }
    }

    if (this.isCoreExposed()) {
      const pulse = 0.14 + Math.sin(this.corePulse) * 0.06;
      const reticleRadius = SLAG_HAULER_CORE_OUTER_RADIUS + 9 + Math.sin(this.corePulse * 1.4) * 3;
      const coreCenter = this.getCoreCenter();
      g.fillStyle(COLORS.GATE, 0.1 + pulse);
      g.fillCircle(coreCenter.x, coreCenter.y, SLAG_HAULER_CORE_OUTER_RADIUS);
      g.lineStyle(1.2, COLORS.BG, 0.86);
      g.strokeCircle(coreCenter.x, coreCenter.y, reticleRadius + 1.5);
      g.lineStyle(1.5, COLORS.GATE, 0.62 + pulse);
      g.strokeCircle(coreCenter.x, coreCenter.y, reticleRadius);
      for (let i = 0; i < 4; i++) {
        const angle = this.corePulse * 0.5 + i * (Math.PI / 2);
        const inner = SLAG_HAULER_CORE_OUTER_RADIUS + 5;
        const outer = SLAG_HAULER_CORE_OUTER_RADIUS + 16;
        g.lineStyle(2, COLORS.GATE, 0.68);
        g.lineBetween(
          coreCenter.x + Math.cos(angle) * inner,
          coreCenter.y + Math.sin(angle) * inner,
          coreCenter.x + Math.cos(angle) * outer,
          coreCenter.y + Math.sin(angle) * outer,
        );
      }
      g.lineStyle(2.1, COLORS.GATE, this.coreEntryPrimed ? 1 : 0.88);
      g.strokeCircle(coreCenter.x, coreCenter.y, SLAG_HAULER_CORE_OUTER_RADIUS);
      g.lineStyle(1.25, 0xffffff, 0.56);
      g.strokeCircle(coreCenter.x, coreCenter.y, SLAG_HAULER_CORE_INNER_RADIUS);
      g.fillStyle(COLORS.BG, 0.94);
      g.fillCircle(coreCenter.x, coreCenter.y, SLAG_HAULER_CORE_INNER_RADIUS - 3);
      this.drawCoreDevice(g, coreCenter.x, coreCenter.y, SLAG_HAULER_CORE_INNER_RADIUS);
    }
  }

  private drawCoreDevice(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
    const spin = this.corePulse * 0.7;
    const deviceRadius = radius * 0.62;
    const points: LocalPoint[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = spin + i * (Math.PI / 2);
      points.push({
        x: x + Math.cos(angle) * deviceRadius,
        y: y + Math.sin(angle) * deviceRadius,
      });
    }

    g.fillStyle(COLORS.GATE, 0.2);
    g.lineStyle(1.6, COLORS.GATE, 0.95);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.lineStyle(1.1, 0xffffff, 0.78);
    g.strokeCircle(x, y, radius * 0.28);
    g.fillStyle(0xffffff, 0.72);
    g.fillCircle(x, y, radius * 0.12);
  }
}
