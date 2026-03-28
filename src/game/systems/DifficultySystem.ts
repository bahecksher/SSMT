import Phaser from 'phaser';
import type { PhaseConfig } from '../types';
import {
  BOMB_DROP_CHANCE,
  BONUS_PICKUP_RADIUS,
  DRIFTER_MINEABLE_CHANCE,
  DRIFTER_SPEED_BASE,
  ENEMY_BONUS_POINTS,
  NPC_BONUS_DROP_CHANCE,
  NPC_BONUS_POINTS,
} from '../data/tuning';
import { getPhaseConfig, pickAsteroidSize } from '../data/phaseConfig';
import { DrifterHazard } from '../entities/DrifterHazard';
import { BeamHazard } from '../entities/BeamHazard';
import { EnemyShip } from '../entities/EnemyShip';
import { NPCShip } from '../entities/NPCShip';
import { SHIELD_PICKUP_RADIUS } from '../entities/ShieldPickup';
import { ShipDebris } from '../entities/ShipDebris';
import { Overlays } from '../ui/Overlays';
import { getLayout } from '../layout';

export class DifficultySystem {
  private scene: Phaser.Scene;
  private config: PhaseConfig;
  private drifters: DrifterHazard[] = [];
  private beams: BeamHazard[] = [];
  private enemies: EnemyShip[] = [];
  private npcs: NPCShip[] = [];
  private deadNPCPositions: { x: number; y: number; vx: number; vy: number }[] = [];
  private bonusDropPositions: { x: number; y: number; vx: number; vy: number; points: number }[] = [];
  private bombDropPositions: { x: number; y: number; vx: number; vy: number }[] = [];
  private shipDebris: ShipDebris[] = [];
  private drifterTimer = 0;
  private beamTimer = 0;
  private beamBurstQueue = 0;
  private beamBurstTimer = 0;
  private enemyTimer = 0;
  private npcTimer = 0;

  constructor(scene: Phaser.Scene, phase: number) {
    this.scene = scene;
    this.config = getPhaseConfig(phase);
  }

  setPhase(phase: number): void {
    this.config = getPhaseConfig(phase);
  }

  getConfig(): PhaseConfig {
    return this.config;
  }

  getDrifters(): DrifterHazard[] {
    return this.drifters;
  }

  getBeams(): BeamHazard[] {
    return this.beams;
  }

  getEnemies(): EnemyShip[] {
    return this.enemies;
  }

  getNPCs(): NPCShip[] {
    return this.npcs;
  }

  consumeDeadNPCs(): { x: number; y: number; vx: number; vy: number }[] {
    const dead = this.deadNPCPositions;
    this.deadNPCPositions = [];
    return dead;
  }

  consumeBonusDrops(): { x: number; y: number; vx: number; vy: number; points: number }[] {
    const drops = this.bonusDropPositions;
    this.bonusDropPositions = [];
    return drops;
  }

  consumeBombDrops(): { x: number; y: number; vx: number; vy: number }[] {
    const drops = this.bombDropPositions;
    this.bombDropPositions = [];
    return drops;
  }

  update(delta: number, playerX = 0, playerY = 0): void {
    this.drifterTimer += delta;
    if (this.drifterTimer >= this.config.hazardSpawnRate && this.drifters.length < this.config.maxConcurrentDrifters) {
      const speed = DRIFTER_SPEED_BASE * this.config.hazardSpeedMultiplier;
      const sizeScale = pickAsteroidSize(this.config.phaseNumber);
      const adjustedSpeed = speed * (1 / Math.sqrt(sizeScale));
      const isMineable = Math.random() < DRIFTER_MINEABLE_CHANCE;
      this.drifters.push(new DrifterHazard(this.scene, adjustedSpeed, sizeScale, isMineable));
      this.drifterTimer = 0;
    }

    if (this.config.beamEnabled) {
      this.beamTimer += delta;
      if (this.beamTimer >= this.config.beamFrequency && this.beamBurstQueue === 0) {
        Overlays.beamWarningFlash(this.scene);
        // First beam fires immediately, rest queued as rapid burst
        this.beams.push(new BeamHazard(this.scene, this.config.beamWidth));
        this.beamBurstQueue = this.config.beamBurstCount - 1;
        this.beamBurstTimer = 0;
        this.beamTimer = 0;
      }
      // Rapid-fire burst: spawn queued beams with short delays
      if (this.beamBurstQueue > 0) {
        this.beamBurstTimer += delta;
        if (this.beamBurstTimer >= this.config.beamBurstDelay) {
          this.beams.push(new BeamHazard(this.scene, this.config.beamWidth));
          this.beamBurstQueue--;
          this.beamBurstTimer -= this.config.beamBurstDelay;
        }
      }
    }

    if (this.config.enemyEnabled) {
      this.enemyTimer += delta;
      if (this.enemyTimer >= this.config.enemySpawnRate && this.enemies.length < this.config.maxConcurrentEnemies) {
        this.enemies.push(new EnemyShip(this.scene));
        this.enemyTimer = 0;
      }
    }

    if (this.config.npcEnabled) {
      this.npcTimer += delta;
      if (this.npcTimer >= this.config.npcSpawnRate && this.npcs.length < this.config.maxConcurrentNPCs) {
        this.npcs.push(new NPCShip(this.scene));
        this.npcTimer = 0;
      }
    }

    for (const d of this.drifters) d.update(delta);
    for (const npc of this.npcs) npc.update(delta);

    for (const e of this.enemies) {
      const npcTarget = this.findClosestNPC(e.x, e.y);
      if (npcTarget) {
        const distToPlayer = Math.sqrt((playerX - e.x) ** 2 + (playerY - e.y) ** 2);
        const distToNpc = Math.sqrt((npcTarget.x - e.x) ** 2 + (npcTarget.y - e.y) ** 2);
        if (distToNpc < distToPlayer * 0.8) {
          e.update(delta, npcTarget.x, npcTarget.y);
          continue;
        }
      }
      e.update(delta, playerX, playerY);
    }

    this.resolveEnemyDrifterCollisions();
    this.resolveNPCDrifterCollisions();
    this.resolveEnemyNPCCollisions();
    this.resolveDrifterCollisions();
    this.resolveBeamEntityCollisions();

    for (let i = this.drifters.length - 1; i >= 0; i--) {
      if (!this.drifters[i].active) {
        this.drifters[i].destroy();
        this.drifters.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        const layout = getLayout();
        if (
          enemy.x >= layout.arenaLeft - 50 && enemy.x <= layout.arenaRight + 50 &&
          enemy.y >= layout.arenaTop - 50 && enemy.y <= layout.arenaBottom + 50
        ) {
          this.shipDebris.push(new ShipDebris(this.scene, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), 0xff00ff, enemy.radius));
          if (this.canDropBonusAt(enemy.x, enemy.y)) {
            this.bonusDropPositions.push({
              x: enemy.x,
              y: enemy.y,
              vx: enemy.getVelocityX() * 0.45,
              vy: enemy.getVelocityY() * 0.45,
              points: ENEMY_BONUS_POINTS,
            });
            if (Math.random() < BOMB_DROP_CHANCE) {
              this.bombDropPositions.push({
                x: enemy.x,
                y: enemy.y,
                vx: enemy.getVelocityX() * 0.3,
                vy: enemy.getVelocityY() * 0.3,
              });
            }
          }
        }
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      if (!npc.active) {
        if (npc.killedByHazard) {
          this.shipDebris.push(new ShipDebris(this.scene, npc.x, npc.y, npc.vx, npc.vy, 0xffcc44, npc.radius));
          if (this.canDropShieldAt(npc.x, npc.y)) {
            this.deadNPCPositions.push({ x: npc.x, y: npc.y, vx: npc.vx, vy: npc.vy });
          }
          if (this.canDropBonusAt(npc.x, npc.y) && Math.random() < NPC_BONUS_DROP_CHANCE) {
            this.bonusDropPositions.push({
              x: npc.x,
              y: npc.y,
              vx: npc.vx * 0.5,
              vy: npc.vy * 0.5,
              points: NPC_BONUS_POINTS,
            });
          }
        }
        npc.destroy();
        this.npcs.splice(i, 1);
      }
    }

    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.update(delta);
      if (!b.active) {
        b.destroy();
        this.beams.splice(i, 1);
      }
    }

    for (let i = this.shipDebris.length - 1; i >= 0; i--) {
      const d = this.shipDebris[i];
      d.update(delta);
      if (!d.active) {
        d.destroy();
        this.shipDebris.splice(i, 1);
      }
    }
  }

  updateVisualOnly(delta: number, playerX = 0, playerY = 0): void {
    for (const d of this.drifters) d.update(delta);
    for (const npc of this.npcs) npc.update(delta);

    for (const e of this.enemies) {
      const npcTarget = this.findClosestNPC(e.x, e.y);
      if (npcTarget) {
        const distToPlayer = Math.sqrt((playerX - e.x) ** 2 + (playerY - e.y) ** 2);
        const distToNpc = Math.sqrt((npcTarget.x - e.x) ** 2 + (npcTarget.y - e.y) ** 2);
        if (distToNpc < distToPlayer * 0.8) {
          e.update(delta, npcTarget.x, npcTarget.y);
          continue;
        }
      }
      e.update(delta, playerX, playerY);
    }

    for (let i = this.drifters.length - 1; i >= 0; i--) {
      if (!this.drifters[i].active) {
        this.drifters[i].destroy();
        this.drifters.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].active) {
        this.enemies[i].destroy();
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      if (!this.npcs[i].active) {
        this.npcs[i].destroy();
        this.npcs.splice(i, 1);
      }
    }

    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.update(delta);
      if (!b.active) {
        b.destroy();
        this.beams.splice(i, 1);
      }
    }

    for (let i = this.shipDebris.length - 1; i >= 0; i--) {
      const d = this.shipDebris[i];
      d.update(delta);
      if (!d.active) {
        d.destroy();
        this.shipDebris.splice(i, 1);
      }
    }
  }

  shieldDestroyDrifter(target: DrifterHazard): void {
    const childScale = target.radiusScale * 0.55;

    if (childScale >= DrifterHazard.MIN_SPLIT_SCALE) {
      const speed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
      const scatter = speed * 0.8;
      const angle = Math.atan2(target.vy, target.vx);
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);

      this.drifters.push(DrifterHazard.createFragment(
        this.scene,
        target.x + perpX * target.radius * 0.5,
        target.y + perpY * target.radius * 0.5,
        target.vx + perpX * scatter,
        target.vy + perpY * scatter,
        childScale,
        target.isMineable,
      ));
      this.drifters.push(DrifterHazard.createFragment(
        this.scene,
        target.x - perpX * target.radius * 0.5,
        target.y - perpY * target.radius * 0.5,
        target.vx - perpX * scatter,
        target.vy - perpY * scatter,
        childScale,
        target.isMineable,
      ));
    }

    target.active = false;
  }

  private resolveDrifterCollisions(): void {
    const newFragments: DrifterHazard[] = [];

    for (let i = 0; i < this.drifters.length; i++) {
      const a = this.drifters[i];
      if (!a.active) continue;

      for (let j = i + 1; j < this.drifters.length; j++) {
        const b = this.drifters[j];
        if (!b.active) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          const totalMass = a.radius + b.radius;
          a.x -= nx * overlap * (b.radius / totalMass);
          a.y -= ny * overlap * (b.radius / totalMass);
          b.x += nx * overlap * (a.radius / totalMass);
          b.y += ny * overlap * (a.radius / totalMass);

          const massA = a.radius * a.radius;
          const massB = b.radius * b.radius;
          const relVx = a.vx - b.vx;
          const relVy = a.vy - b.vy;
          const relDotN = relVx * nx + relVy * ny;

          if (relDotN > 0) {
            const impulse = (2 * relDotN) / (massA + massB);
            a.vx -= impulse * massB * nx;
            a.vy -= impulse * massB * ny;
            b.vx += impulse * massA * nx;
            b.vy += impulse * massA * ny;

            a.bounceCount++;
            b.bounceCount++;

            const victims = a.radiusScale <= b.radiusScale && a.radiusScale !== b.radiusScale
              ? [a]
              : b.radiusScale < a.radiusScale
                ? [b]
                : [a, b];

            for (const ast of victims) {
              if (!ast.active) continue;
              const childScale = ast.radiusScale * 0.55;
              const canSplit = childScale >= DrifterHazard.MIN_SPLIT_SCALE &&
                this.drifters.length + newFragments.length < this.config.maxConcurrentDrifters + 8;

              if (canSplit) {
                ast.active = false;
                const speed = Math.sqrt(ast.vx * ast.vx + ast.vy * ast.vy);
                const scatter = speed * 0.6;
                const perpX = -ny;
                const perpY = nx;

                newFragments.push(DrifterHazard.createFragment(
                  this.scene,
                  ast.x + perpX * ast.radius * 0.5,
                  ast.y + perpY * ast.radius * 0.5,
                  ast.vx + perpX * scatter,
                  ast.vy + perpY * scatter,
                  childScale,
                  ast.isMineable,
                ));
                newFragments.push(DrifterHazard.createFragment(
                  this.scene,
                  ast.x - perpX * ast.radius * 0.5,
                  ast.y - perpY * ast.radius * 0.5,
                  ast.vx - perpX * scatter,
                  ast.vy - perpY * scatter,
                  childScale,
                  ast.isMineable,
                ));
              } else {
                ast.active = false;
                this.shipDebris.push(new ShipDebris(this.scene, ast.x, ast.y, ast.vx, ast.vy, 0xff3366, ast.radius));
              }
            }
          }
        }
      }
    }

    for (const f of newFragments) {
      this.drifters.push(f);
    }
  }

  private findClosestNPC(x: number, y: number): NPCShip | null {
    let closest: NPCShip | null = null;
    let bestDist = Infinity;
    for (const npc of this.npcs) {
      if (!npc.active) continue;
      const d = Math.sqrt((npc.x - x) ** 2 + (npc.y - y) ** 2);
      if (d < bestDist) {
        bestDist = d;
        closest = npc;
      }
    }
    return closest;
  }

  private resolveNPCDrifterCollisions(): void {
    for (const npc of this.npcs) {
      if (!npc.active) continue;
      for (const drifter of this.drifters) {
        if (!drifter.active) continue;
        const dx = npc.x - drifter.x;
        const dy = npc.y - drifter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < npc.radius + drifter.radius) {
          if (npc.consumeShield()) {
            this.shieldDestroyDrifter(drifter);
          } else {
            npc.active = false;
            npc.killedByHazard = true;
          }
          break;
        }
      }
    }
  }

  private resolveEnemyNPCCollisions(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      for (const npc of this.npcs) {
        if (!npc.active) continue;
        const dx = enemy.x - npc.x;
        const dy = enemy.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + npc.radius) {
          if (npc.consumeShield()) {
            enemy.active = false;
          } else {
            npc.active = false;
            npc.killedByHazard = true;
          }
        }
      }
    }
  }

  private resolveEnemyDrifterCollisions(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      for (const drifter of this.drifters) {
        if (!drifter.active) continue;
        const dx = enemy.x - drifter.x;
        const dy = enemy.y - drifter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + drifter.radius) {
          this.shieldDestroyDrifter(drifter);
        }
      }
    }
  }

  private resolveBeamEntityCollisions(): void {
    for (const beam of this.beams) {
      if (!beam.active || !beam.isLethal()) continue;
      const halfBeam = beam.width / 2;

      // Destroy drifters hit by beam
      for (const drifter of this.drifters) {
        if (!drifter.active) continue;
        const dist = beam.isHorizontal
          ? Math.abs(drifter.y - beam.y1)
          : Math.abs(drifter.x - beam.x1);
        if (dist < halfBeam + drifter.radius) {
          drifter.active = false;
          this.shipDebris.push(new ShipDebris(this.scene, drifter.x, drifter.y, drifter.vx, drifter.vy, 0xff3366, drifter.radius));
        }
      }

      // Destroy enemies hit by beam
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dist = beam.isHorizontal
          ? Math.abs(enemy.y - beam.y1)
          : Math.abs(enemy.x - beam.x1);
        if (dist < halfBeam + enemy.radius) {
          enemy.active = false;
          this.shipDebris.push(new ShipDebris(this.scene, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), 0xff00ff, enemy.radius));
          if (this.canDropBonusAt(enemy.x, enemy.y)) {
            this.bonusDropPositions.push({
              x: enemy.x, y: enemy.y,
              vx: enemy.getVelocityX() * 0.45, vy: enemy.getVelocityY() * 0.45,
              points: ENEMY_BONUS_POINTS,
            });
          }
        }
      }

      // Destroy NPCs hit by beam
      for (const npc of this.npcs) {
        if (!npc.active) continue;
        const dist = beam.isHorizontal
          ? Math.abs(npc.y - beam.y1)
          : Math.abs(npc.x - beam.x1);
        if (dist < halfBeam + npc.radius) {
          npc.active = false;
          npc.killedByHazard = true;
        }
      }
    }
  }

  private canDropShieldAt(x: number, y: number): boolean {
    const layout = getLayout();
    return (
      x >= layout.arenaLeft + SHIELD_PICKUP_RADIUS &&
      x <= layout.arenaRight - SHIELD_PICKUP_RADIUS &&
      y >= layout.arenaTop + SHIELD_PICKUP_RADIUS &&
      y <= layout.arenaBottom - SHIELD_PICKUP_RADIUS
    );
  }

  private canDropBonusAt(x: number, y: number): boolean {
    const layout = getLayout();
    return (
      x >= layout.arenaLeft + BONUS_PICKUP_RADIUS &&
      x <= layout.arenaRight - BONUS_PICKUP_RADIUS &&
      y >= layout.arenaTop + BONUS_PICKUP_RADIUS &&
      y <= layout.arenaBottom - BONUS_PICKUP_RADIUS
    );
  }

  destroy(): void {
    for (const d of this.drifters) d.destroy();
    for (const b of this.beams) b.destroy();
    for (const e of this.enemies) e.destroy();
    for (const n of this.npcs) n.destroy();
    for (const sd of this.shipDebris) sd.destroy();
    this.drifters = [];
    this.beams = [];
    this.enemies = [];
    this.npcs = [];
    this.shipDebris = [];
  }
}
