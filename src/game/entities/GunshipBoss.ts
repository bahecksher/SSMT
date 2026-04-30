import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  GUNSHIP_BOSS_BEAM_ACTIVE_DURATION,
  GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION,
  GUNSHIP_BOSS_BEAM_STAGGER_MS,
  GUNSHIP_BOSS_BEAM_WARNING_DURATION,
  GUNSHIP_BOSS_BEAM_WIDTH,
  GUNSHIP_BOSS_BODY_HALF_LENGTH,
  GUNSHIP_BOSS_BODY_SPEED,
  GUNSHIP_BOSS_BODY_THICKNESS,
  GUNSHIP_BOSS_CORE_INNER_RADIUS,
  GUNSHIP_BOSS_CORE_OUTER_RADIUS,
  GUNSHIP_BOSS_GUN_COUNT,
  GUNSHIP_BOSS_GUN_RADIUS,
} from '../data/tuning';
import { getLayout } from '../layout';
import type { BossDestructionPlan, BossDropData, BossEntity, BossVentDrop } from './BossEntity';

type BossBeamState = 'cooldown' | 'warning' | 'active';
type BeamSide = -1 | 1;

interface GunMountState {
  offset: number;
  alive: boolean;
  beamOffsetMs: number;
}

interface LocalPoint {
  x: number;
  y: number;
}

const PASS_OVERSCAN = GUNSHIP_BOSS_BODY_HALF_LENGTH + GUNSHIP_BOSS_BODY_THICKNESS + 96;

export class GunshipBoss implements BossEntity {
  graphic: Phaser.GameObjects.Graphics;
  active = true;

  private x = 0;
  private y = 0;
  private headingX = 1;
  private headingY = 0;
  private beamPulse = 0;
  private beamCycleElapsed = 0;
  private beamWarningPulsePending = false;
  private beamWarningClusterActive = false;
  private corePulse = 0;
  private coreEntryPrimed = false;
  private guns: GunMountState[] = [];

  constructor(scene: Phaser.Scene, gunCount = GUNSHIP_BOSS_GUN_COUNT) {
    this.graphic = scene.add.graphics().setDepth(6);

    const usableSpan = GUNSHIP_BOSS_BODY_HALF_LENGTH * 1.52;
    const offsetStart = gunCount === 1 ? 0 : -usableSpan / 2;
    const offsetStep = gunCount <= 1 ? 0 : usableSpan / (gunCount - 1);
    for (let i = 0; i < gunCount; i++) {
      this.guns.push({
        offset: offsetStart + offsetStep * i,
        alive: true,
        beamOffsetMs: i * GUNSHIP_BOSS_BEAM_STAGGER_MS,
      });
    }

    this.beginPass();
    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    this.beamPulse += delta * 0.006;
    this.beamCycleElapsed += delta;
    this.corePulse += delta * 0.0045;

    const hasWarning = !this.isCoreExposed() && this.getWarningGunCount() > 0;
    if (!this.beamWarningClusterActive && hasWarning) {
      this.beamWarningPulsePending = true;
    }
    this.beamWarningClusterActive = hasWarning;

    this.x += this.headingX * GUNSHIP_BOSS_BODY_SPEED * (delta / 1000);
    this.y += this.headingY * GUNSHIP_BOSS_BODY_SPEED * (delta / 1000);
    if (this.isOutOfArena()) {
      this.beginPass();
    }

    this.draw();
  }

  getAliveGunCount(): number {
    return this.guns.filter((gun) => gun.alive).length;
  }

  isCoreExposed(): boolean {
    return this.active && this.getAliveGunCount() === 0;
  }

  getStatusLabel(): string {
    if (this.isCoreExposed()) {
      return this.coreEntryPrimed ? 'GUNSHIP // CORE BREACH' : 'GUNSHIP // CORE EXPOSED';
    }

    const aliveGunCount = this.getAliveGunCount();
    const activeGunCount = this.getActiveGunCount();
    const warningGunCount = this.getWarningGunCount();

    if (activeGunCount > 0) {
      return `GUNSHIP // FIRING ${activeGunCount} // GUNS ${aliveGunCount}`;
    }

    if (warningGunCount > 0) {
      return `GUNSHIP // WARNING ${warningGunCount} // GUNS ${aliveGunCount}`;
    }

    return `GUNSHIP // SAFE WINDOW // GUNS ${aliveGunCount}`;
  }

  getStatusColor(): number {
    if (this.isCoreExposed()) {
      return COLORS.GATE;
    }

    if (this.getActiveGunCount() > 0 || this.getWarningGunCount() > 0) {
      return COLORS.ENEMY;
    }

    return COLORS.HUD;
  }

  getCollidingHardpointIndex(playerX: number, playerY: number, playerRadius: number): number | null {
    if (!this.active || this.isCoreExposed()) {
      return null;
    }

    for (let i = 0; i < this.guns.length; i++) {
      if (!this.guns[i].alive) continue;
      const sides: BeamSide[] = [-1, 1];
      for (const side of sides) {
        const gunPos = this.getGunPosition(i, side);
        const dist = Phaser.Math.Distance.Between(playerX, playerY, gunPos.x, gunPos.y);
        if (dist <= GUNSHIP_BOSS_GUN_RADIUS + playerRadius + 2) {
          return i;
        }
      }
    }

    return null;
  }

  consumeWarningPulse(): boolean {
    const pending = this.beamWarningPulsePending;
    this.beamWarningPulsePending = false;
    return pending;
  }

  consumeAsteroidVents(): BossVentDrop[] {
    return [];
  }

  destroyHardpoint(index: number): BossDropData | null {
    if (!this.active || !this.guns[index]?.alive) {
      return null;
    }

    this.guns[index].alive = false;
    this.coreEntryPrimed = false;
    const gunPos = this.getGunPosition(index, this.getGunBeamSide(index));
    return {
      x: gunPos.x,
      y: gunPos.y,
      vx: this.headingX * GUNSHIP_BOSS_BODY_SPEED * 0.25,
      vy: this.headingY * GUNSHIP_BOSS_BODY_SPEED * 0.25,
    };
  }

  checkBeamHit(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.active || this.isCoreExposed()) {
      return false;
    }

    for (let i = 0; i < this.guns.length; i++) {
      if (!this.guns[i].alive || this.getGunBeamState(i) !== 'active') continue;
      const side = this.getGunBeamSide(i);
      const gunPos = this.getGunPosition(i, side);
      const beamEnd = this.getBeamEndpoint(gunPos.x, gunPos.y, getLayout(), side);
      if (this.beamIntersectsCircle(gunPos.x, gunPos.y, beamEnd.x, beamEnd.y, targetX, targetY, targetRadius)) {
        return true;
      }
    }

    return false;
  }

  checkCoreContact(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }

    const coreCenter = this.getCoreCenter();
    return Phaser.Math.Distance.Between(targetX, targetY, coreCenter.x, coreCenter.y) <= GUNSHIP_BOSS_CORE_OUTER_RADIUS + targetRadius;
  }

  updateCoreBreach(playerX: number, playerY: number, playerRadius: number, hasShield: boolean): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }

    const coreCenter = this.getCoreCenter();
    const dist = Phaser.Math.Distance.Between(playerX, playerY, coreCenter.x, coreCenter.y);
    const enteredCore = dist <= GUNSHIP_BOSS_CORE_INNER_RADIUS + playerRadius + 4;

    if (!hasShield) {
      this.coreEntryPrimed = false;
      return false;
    }

    if (enteredCore) {
      this.coreEntryPrimed = true;
      return false;
    }

    if (this.coreEntryPrimed && dist >= GUNSHIP_BOSS_CORE_OUTER_RADIUS + playerRadius + 6) {
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

  destroy(): void {
    this.graphic.destroy();
  }

  private beginPass(): void {
    this.beamCycleElapsed = 0;
    this.beamWarningPulsePending = false;
    this.beamWarningClusterActive = false;
    this.coreEntryPrimed = false;

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

  private getGunPosition(index: number, side: BeamSide): { x: number; y: number } {
    const offset = this.guns[index]?.offset ?? 0;
    return this.toWorldPoint(offset, side * GUNSHIP_BOSS_BODY_THICKNESS * 0.34);
  }

  private getCoreCenter(): { x: number; y: number } {
    return this.toWorldPoint(0, GUNSHIP_BOSS_BODY_THICKNESS * 0.08);
  }

  private beamIntersectsCircle(
    gunX: number,
    gunY: number,
    beamEndX: number,
    beamEndY: number,
    targetX: number,
    targetY: number,
    targetRadius: number,
  ): boolean {
    const killDist = GUNSHIP_BOSS_BEAM_WIDTH / 2 + targetRadius;
    const segmentLengthSq = Phaser.Math.Distance.Squared(gunX, gunY, beamEndX, beamEndY);
    if (segmentLengthSq <= 0) return false;
    const t = Phaser.Math.Clamp(
      ((targetX - gunX) * (beamEndX - gunX) + (targetY - gunY) * (beamEndY - gunY)) / segmentLengthSq,
      0,
      1,
    );
    const closestX = Phaser.Math.Linear(gunX, beamEndX, t);
    const closestY = Phaser.Math.Linear(gunY, beamEndY, t);
    return Phaser.Math.Distance.Between(targetX, targetY, closestX, closestY) < killDist;
  }

  private getBeamCycleDuration(): number {
    return GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION + GUNSHIP_BOSS_BEAM_WARNING_DURATION + GUNSHIP_BOSS_BEAM_ACTIVE_DURATION;
  }

  private getGunBeamElapsed(index: number): number {
    const cycleDuration = this.getBeamCycleDuration();
    return (this.beamCycleElapsed + (this.guns[index]?.beamOffsetMs ?? 0)) % cycleDuration;
  }

  private getGunBeamSide(index: number): BeamSide {
    const cycleDuration = this.getBeamCycleDuration();
    const cycleIndex = Math.floor((this.beamCycleElapsed + (this.guns[index]?.beamOffsetMs ?? 0)) / cycleDuration);
    return cycleIndex % 2 === 0 ? 1 : -1;
  }

  private getBeamStateForElapsed(elapsed: number): BossBeamState {
    if (elapsed < GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION) {
      return 'cooldown';
    }

    if (elapsed < GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION + GUNSHIP_BOSS_BEAM_WARNING_DURATION) {
      return 'warning';
    }

    return 'active';
  }

  private getGunBeamState(index: number): BossBeamState {
    if (this.isCoreExposed() || !this.guns[index]?.alive) {
      return 'cooldown';
    }

    return this.getBeamStateForElapsed(this.getGunBeamElapsed(index));
  }

  private getBeamStateProgressForElapsed(elapsed: number, state: BossBeamState): number {
    if (state === 'cooldown') {
      return Phaser.Math.Clamp(elapsed / GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION, 0, 1);
    }

    const warningStart = GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION;
    if (state === 'warning') {
      return Phaser.Math.Clamp((elapsed - warningStart) / GUNSHIP_BOSS_BEAM_WARNING_DURATION, 0, 1);
    }

    const activeStart = warningStart + GUNSHIP_BOSS_BEAM_WARNING_DURATION;
    return Phaser.Math.Clamp((elapsed - activeStart) / GUNSHIP_BOSS_BEAM_ACTIVE_DURATION, 0, 1);
  }

  private getGunBeamStateProgress(index: number, state: BossBeamState): number {
    return this.getBeamStateProgressForElapsed(this.getGunBeamElapsed(index), state);
  }

  private getWarningGunCount(): number {
    let count = 0;
    for (let i = 0; i < this.guns.length; i++) {
      if (this.guns[i].alive && this.getGunBeamState(i) === 'warning') {
        count++;
      }
    }
    return count;
  }

  private getActiveGunCount(): number {
    let count = 0;
    for (let i = 0; i < this.guns.length; i++) {
      if (this.guns[i].alive && this.getGunBeamState(i) === 'active') {
        count++;
      }
    }
    return count;
  }

  private getBeamEndpoint(
    gunX: number,
    gunY: number,
    layout: ReturnType<typeof getLayout>,
    side: BeamSide,
  ): { x: number; y: number } {
    const { inward } = this.getOrientationVectors();
    const beamDir = { x: inward.x * side, y: inward.y * side };
    let maxDistance = Number.POSITIVE_INFINITY;
    if (beamDir.x > 0) {
      maxDistance = Math.min(maxDistance, (layout.arenaRight - gunX) / beamDir.x);
    } else if (beamDir.x < 0) {
      maxDistance = Math.min(maxDistance, (layout.arenaLeft - gunX) / beamDir.x);
    }
    if (beamDir.y > 0) {
      maxDistance = Math.min(maxDistance, (layout.arenaBottom - gunY) / beamDir.y);
    } else if (beamDir.y < 0) {
      maxDistance = Math.min(maxDistance, (layout.arenaTop - gunY) / beamDir.y);
    }

    const distance = Number.isFinite(maxDistance) ? Math.max(0, maxDistance) : 0;
    return {
      x: gunX + beamDir.x * distance,
      y: gunY + beamDir.y * distance,
    };
  }

  private getHullPoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 1.02, y: -halfThickness * 0.34 },
      { x: -halfLength * 0.88, y: -halfThickness * 1.02 },
      { x: -halfLength * 0.4, y: -halfThickness * 0.9 },
      { x: -halfLength * 0.15, y: -halfThickness * 1.22 },
      { x: halfLength * 0.15, y: -halfThickness * 1.22 },
      { x: halfLength * 0.4, y: -halfThickness * 0.9 },
      { x: halfLength * 0.88, y: -halfThickness * 1.02 },
      { x: halfLength * 1.02, y: -halfThickness * 0.34 },
      { x: halfLength * 1.14, y: halfThickness * 0.08 },
      { x: halfLength * 0.9, y: halfThickness * 0.54 },
      { x: halfLength * 0.42, y: halfThickness * 0.88 },
      { x: halfLength * 0.16, y: halfThickness * 1.2 },
      { x: 0, y: halfThickness * 1.84 },
      { x: -halfLength * 0.16, y: halfThickness * 1.2 },
      { x: -halfLength * 0.42, y: halfThickness * 0.88 },
      { x: -halfLength * 0.9, y: halfThickness * 0.54 },
      { x: -halfLength * 1.14, y: halfThickness * 0.08 },
    ];
  }

  private getInnerHullPoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 0.9, y: -halfThickness * 0.16 },
      { x: -halfLength * 0.68, y: -halfThickness * 0.74 },
      { x: -halfLength * 0.22, y: -halfThickness * 0.58 },
      { x: halfLength * 0.22, y: -halfThickness * 0.58 },
      { x: halfLength * 0.68, y: -halfThickness * 0.74 },
      { x: halfLength * 0.9, y: -halfThickness * 0.16 },
      { x: halfLength * 0.72, y: halfThickness * 0.32 },
      { x: halfLength * 0.28, y: halfThickness * 0.6 },
      { x: 0, y: halfThickness * 1.16 },
      { x: -halfLength * 0.28, y: halfThickness * 0.6 },
      { x: -halfLength * 0.72, y: halfThickness * 0.32 },
    ];
  }

  private getBridgePoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 0.2, y: -halfThickness * 0.56 },
      { x: halfLength * 0.2, y: -halfThickness * 0.56 },
      { x: halfLength * 0.28, y: -halfThickness * 0.12 },
      { x: 0, y: halfThickness * 0.34 },
      { x: -halfLength * 0.28, y: -halfThickness * 0.12 },
    ];
  }

  private getFinPoints(side: -1 | 1, halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: side * halfLength * 0.66, y: -halfThickness * 0.12 },
      { x: side * halfLength * 1.22, y: halfThickness * 0.08 },
      { x: side * halfLength * 0.72, y: halfThickness * 0.72 },
    ];
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

  private drawLocalLine(
    g: Phaser.GameObjects.Graphics,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    color: number,
    alpha: number,
  ): void {
    const from = this.toWorldPoint(fromX, fromY);
    const to = this.toWorldPoint(toX, toY);
    g.lineStyle(width, color, alpha);
    g.lineBetween(from.x, from.y, to.x, to.y);
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    if (!this.active) {
      return;
    }

    const hullColor = COLORS.ENEMY;
    const halfLength = GUNSHIP_BOSS_BODY_HALF_LENGTH;
    const halfThickness = GUNSHIP_BOSS_BODY_THICKNESS / 2;
    const hullPoints = this.getHullPoints(halfLength, halfThickness);
    const innerHullPoints = this.getInnerHullPoints(halfLength, halfThickness);
    const bridgePoints = this.getBridgePoints(halfLength, halfThickness);

    this.drawLocalPolygon(g, hullPoints, hullColor, 0.08, hullColor, 0.3, 1.15);
    this.drawLocalPolygon(g, innerHullPoints, COLORS.BG, 0.9, hullColor, 0.96, 1.6);
    this.drawLocalPolygon(g, innerHullPoints, hullColor, 0.1, hullColor, 0.16, 0.8);
    this.drawLocalPolygon(g, this.getFinPoints(-1, halfLength, halfThickness), hullColor, 0.1, hullColor, 0.56, 1.2);
    this.drawLocalPolygon(g, this.getFinPoints(1, halfLength, halfThickness), hullColor, 0.1, hullColor, 0.56, 1.2);
    this.drawLocalPolygon(
      g,
      bridgePoints,
      this.isCoreExposed() ? COLORS.GATE : COLORS.BG,
      this.isCoreExposed() ? 0.12 : 0.92,
      this.isCoreExposed() ? COLORS.GATE : hullColor,
      this.isCoreExposed() ? 0.62 : 0.42,
      1.1,
    );

    this.drawLocalLine(g, -halfLength * 0.7, -halfThickness * 0.16, 0, halfThickness * 1.28, 1.1, hullColor, 0.26);
    this.drawLocalLine(g, halfLength * 0.7, -halfThickness * 0.16, 0, halfThickness * 1.28, 1.1, hullColor, 0.26);
    this.drawLocalLine(g, 0, -halfThickness * 0.62, 0, halfThickness * 1.42, 1.15, hullColor, 0.34);

    for (let i = 0; i < this.guns.length; i++) {
      const beamState = this.getGunBeamState(i);
      const firingSide = this.getGunBeamSide(i);
      if (this.guns[i].alive) {
        for (const side of [-1, 1] as const) {
          const gunPos = this.getGunPosition(i, side);
          const sideActive = side === firingSide;
          if (sideActive) {
            this.drawBeam(g, i, gunPos.x, gunPos.y, getLayout(), side);
          }
          g.fillStyle(COLORS.BG, 0.94);
          g.lineStyle(1.55, hullColor, sideActive ? 0.98 : 0.46);
          g.fillCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS);
          g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS);
          g.lineStyle(1.3, hullColor, sideActive && beamState !== 'cooldown' ? 0.8 : 0.28);
          g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS * 0.68);

          if (sideActive && beamState === 'warning') {
            const chargeRadius = GUNSHIP_BOSS_GUN_RADIUS * (0.96 + this.getGunBeamStateProgress(i, 'warning') * 0.34);
            g.lineStyle(1.05, hullColor, 0.4 + Math.sin(this.beamPulse + i * 0.8) * 0.12);
            g.strokeCircle(gunPos.x, gunPos.y, chargeRadius);
          } else if (sideActive && beamState === 'active') {
            g.lineStyle(1.15, 0xffffff, 0.64);
            g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS * 0.42);
          }
        }
      } else {
        for (const side of [-1, 1] as const) {
          const gunPos = this.getGunPosition(i, side);
          g.lineStyle(1.15, hullColor, 0.32);
          g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS * 0.8);
        }
      }
    }

    if (this.isCoreExposed()) {
      const pulse = 0.14 + Math.sin(this.corePulse) * 0.06;
      const coreCenter = this.getCoreCenter();
      g.fillStyle(COLORS.GATE, 0.1 + pulse);
      g.fillCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_OUTER_RADIUS);
      g.lineStyle(2.1, COLORS.GATE, this.coreEntryPrimed ? 1 : 0.88);
      g.strokeCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_OUTER_RADIUS);
      g.lineStyle(1.25, 0xffffff, 0.56);
      g.strokeCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_INNER_RADIUS);
      g.fillStyle(COLORS.BG, 0.94);
      g.fillCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_INNER_RADIUS - 3);
    }
  }

  private drawBeam(
    g: Phaser.GameObjects.Graphics,
    index: number,
    gunX: number,
    gunY: number,
    layout: ReturnType<typeof getLayout>,
    side: BeamSide,
  ): void {
    const beamState = this.getGunBeamState(index);
    if (beamState === 'cooldown') {
      return;
    }

    const endpoint = this.getBeamEndpoint(gunX, gunY, layout, side);
    const x2 = endpoint.x;
    const y2 = endpoint.y;
    const beamColor = COLORS.ENEMY;

    if (beamState === 'warning') {
      const warningProgress = this.getGunBeamStateProgress(index, 'warning');
      const flicker = 0.44 + Math.sin(this.beamPulse + index * 0.75 + gunX * 0.01 + gunY * 0.01) * 0.18;
      const alpha = flicker * (0.42 + warningProgress * 0.34);
      const segmentCount = 10;
      for (let i = 0; i < segmentCount; i++) {
        const startT = i / segmentCount;
        const endT = Phaser.Math.Clamp(startT + 0.55 / segmentCount, 0, 1);
        g.lineStyle(2.2, beamColor, alpha * (0.88 - i * 0.035));
        g.lineBetween(
          Phaser.Math.Linear(gunX, x2, startT),
          Phaser.Math.Linear(gunY, y2, startT),
          Phaser.Math.Linear(gunX, x2, endT),
          Phaser.Math.Linear(gunY, y2, endT),
        );
      }

      const growWidth = GUNSHIP_BOSS_BEAM_WIDTH * (0.16 + warningProgress * 0.4);
      g.lineStyle(growWidth, beamColor, 0.08 + warningProgress * 0.1);
      g.lineBetween(gunX, gunY, x2, y2);
      return;
    }

    const activeProgress = this.getGunBeamStateProgress(index, 'active');
    const fadeAlpha = activeProgress > 0.72 ? 1 - (activeProgress - 0.72) / 0.28 : 1;
    const glowAlpha = (0.14 + Math.sin(this.beamPulse + index * 0.7 + gunX * 0.02 + gunY * 0.02) * 0.05) * fadeAlpha;
    g.lineStyle(GUNSHIP_BOSS_BEAM_WIDTH * 2.2, beamColor, glowAlpha);
    g.lineBetween(gunX, gunY, x2, y2);
    g.lineStyle(GUNSHIP_BOSS_BEAM_WIDTH, beamColor, 0.84 * fadeAlpha);
    g.lineBetween(gunX, gunY, x2, y2);
    g.lineStyle(Math.max(2, GUNSHIP_BOSS_BEAM_WIDTH * 0.24), 0xffffff, 0.58 * fadeAlpha);
    g.lineBetween(gunX, gunY, x2, y2);
  }
}
