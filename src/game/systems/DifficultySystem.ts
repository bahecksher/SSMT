import Phaser from 'phaser';
import type { PhaseConfig } from '../types';
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { getPhaseConfig, pickAsteroidSize } from '../data/phaseConfig';
import { DrifterHazard } from '../entities/DrifterHazard';
import { BeamHazard } from '../entities/BeamHazard';
import { EnemyShip } from '../entities/EnemyShip';
import { NPCShip } from '../entities/NPCShip';
import { ARENA_LEFT, ARENA_TOP, ARENA_RIGHT, ARENA_BOTTOM } from '../constants';
import { SHIELD_PICKUP_RADIUS } from '../entities/ShieldPickup';
import { Overlays } from '../ui/Overlays';

export class DifficultySystem {
  private scene: Phaser.Scene;
  private config: PhaseConfig;
  private drifters: DrifterHazard[] = [];
  private beams: BeamHazard[] = [];
  private enemies: EnemyShip[] = [];
  private npcs: NPCShip[] = [];
  private deadNPCPositions: { x: number; y: number }[] = [];
  private drifterTimer = 0;
  private beamTimer = 0;
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

  /** Returns and clears positions of NPCs that died this frame. */
  consumeDeadNPCs(): { x: number; y: number }[] {
    const dead = this.deadNPCPositions;
    this.deadNPCPositions = [];
    return dead;
  }

  update(delta: number, playerX = 0, playerY = 0): void {
    // Spawn drifters
    this.drifterTimer += delta;
    if (this.drifterTimer >= this.config.hazardSpawnRate && this.drifters.length < this.config.maxConcurrentDrifters) {
      const speed = DRIFTER_SPEED_BASE * this.config.hazardSpeedMultiplier;
      const sizeScale = pickAsteroidSize(this.config.phaseNumber);
      // Larger asteroids move a bit slower, smaller ones a bit faster
      const adjustedSpeed = speed * (1 / Math.sqrt(sizeScale));
      this.drifters.push(new DrifterHazard(this.scene, adjustedSpeed, sizeScale));
      this.drifterTimer = 0;
    }

    // Spawn beam volleys (1-3 beams simulating a ship firing across the field)
    if (this.config.beamEnabled) {
      this.beamTimer += delta;
      if (this.beamTimer >= this.config.beamFrequency) {
        // Red warning flash before beams appear
        Overlays.beamWarningFlash(this.scene);

        const count = Phaser.Math.Between(1, 3);
        for (let i = 0; i < count; i++) {
          this.beams.push(new BeamHazard(this.scene));
        }
        this.beamTimer = 0;
      }
    }

    // Spawn enemies
    if (this.config.enemyEnabled) {
      this.enemyTimer += delta;
      if (this.enemyTimer >= this.config.enemySpawnRate && this.enemies.length < this.config.maxConcurrentEnemies) {
        this.enemies.push(new EnemyShip(this.scene));
        this.enemyTimer = 0;
      }
    }

    // Spawn NPCs
    if (this.config.npcEnabled) {
      this.npcTimer += delta;
      if (this.npcTimer >= this.config.npcSpawnRate && this.npcs.length < this.config.maxConcurrentNPCs) {
        this.npcs.push(new NPCShip(this.scene));
        this.npcTimer = 0;
      }
    }

    // Update drifters
    for (const d of this.drifters) {
      d.update(delta);
    }

    // Update NPCs
    for (const npc of this.npcs) {
      npc.update(delta);
    }

    // Update enemies — some hunt NPCs instead of the player
    for (const e of this.enemies) {
      const npcTarget = this.findClosestNPC(e.x, e.y);
      // 40% chance enemy targets closest NPC if one exists and is closer than player
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

    // Enemy-drifter collisions: enemies smash through asteroids
    this.resolveEnemyDrifterCollisions();

    // NPC-drifter collisions: asteroids destroy NPCs
    this.resolveNPCDrifterCollisions();

    // Enemy-NPC collisions: enemies destroy NPCs
    this.resolveEnemyNPCCollisions();

    // Asteroid-asteroid collisions (bounce + split)
    this.resolveDrifterCollisions();

    // Clean inactive drifters
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      if (!this.drifters[i].active) {
        this.drifters[i].destroy();
        this.drifters.splice(i, 1);
      }
    }

    // Clean inactive enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].active) {
        this.enemies[i].destroy();
        this.enemies.splice(i, 1);
      }
    }

    // Clean inactive NPCs — record positions of hazard-killed ones for shield drops
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      if (!this.npcs[i].active) {
        if (this.npcs[i].killedByHazard && this.canDropShieldAt(this.npcs[i].x, this.npcs[i].y)) {
          this.deadNPCPositions.push({ x: this.npcs[i].x, y: this.npcs[i].y });
        }
        this.npcs[i].destroy();
        this.npcs.splice(i, 1);
      }
    }

    // Update and clean beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.update(delta);
      if (!b.active) {
        b.destroy();
        this.beams.splice(i, 1);
      }
    }
  }

  /** Shield impact: destroy small asteroids, split large ones into two fragments. */
  shieldDestroyDrifter(target: DrifterHazard): void {
    const childScale = target.radiusScale * 0.55;

    if (childScale >= DrifterHazard.MIN_SPLIT_SCALE) {
      // Split into two fragments flying apart
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
      ));
      this.drifters.push(DrifterHazard.createFragment(
        this.scene,
        target.x - perpX * target.radius * 0.5,
        target.y - perpY * target.radius * 0.5,
        target.vx - perpX * scatter,
        target.vy - perpY * scatter,
        childScale,
      ));
    }

    // Destroy the original
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
          // Separate overlapping asteroids
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          const totalMass = a.radius + b.radius;
          a.x -= nx * overlap * (b.radius / totalMass);
          a.y -= ny * overlap * (b.radius / totalMass);
          b.x += nx * overlap * (a.radius / totalMass);
          b.y += ny * overlap * (a.radius / totalMass);

          // Elastic bounce (mass proportional to radius squared)
          const massA = a.radius * a.radius;
          const massB = b.radius * b.radius;
          const relVx = a.vx - b.vx;
          const relVy = a.vy - b.vy;
          const relDotN = relVx * nx + relVy * ny;

          // Only resolve if approaching
          if (relDotN > 0) {
            const impulse = (2 * relDotN) / (massA + massB);
            a.vx -= impulse * massB * nx;
            a.vy -= impulse * massB * ny;
            b.vx += impulse * massA * nx;
            b.vy += impulse * massA * ny;
          }

          // Split if both are large enough
          if (a.radiusScale > DrifterHazard.MIN_SPLIT_SCALE * 2 &&
              b.radiusScale > DrifterHazard.MIN_SPLIT_SCALE * 2 &&
              this.drifters.length + newFragments.length < this.config.maxConcurrentDrifters + 8) {
            // Split the larger one
            const toSplit = a.radiusScale >= b.radiusScale ? a : b;
            const childScale = toSplit.radiusScale * 0.55;

            if (childScale >= DrifterHazard.MIN_SPLIT_SCALE) {
              // Kill the parent
              toSplit.active = false;

              // Perpendicular scatter
              const speed = Math.sqrt(toSplit.vx * toSplit.vx + toSplit.vy * toSplit.vy);
              const scatter = speed * 0.6;
              const perpX = -ny;
              const perpY = nx;

              newFragments.push(DrifterHazard.createFragment(
                this.scene,
                toSplit.x + perpX * toSplit.radius * 0.5,
                toSplit.y + perpY * toSplit.radius * 0.5,
                toSplit.vx + perpX * scatter,
                toSplit.vy + perpY * scatter,
                childScale,
              ));
              newFragments.push(DrifterHazard.createFragment(
                this.scene,
                toSplit.x - perpX * toSplit.radius * 0.5,
                toSplit.y - perpY * toSplit.radius * 0.5,
                toSplit.vx - perpX * scatter,
                toSplit.vy - perpY * scatter,
                childScale,
              ));
            }
          }
        }
      }
    }

    // Add fragments
    for (const f of newFragments) {
      this.drifters.push(f);
    }
  }

  /** Find the closest active NPC to a given position. */
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

  /** Asteroids destroy NPCs on contact. */
  private resolveNPCDrifterCollisions(): void {
    for (const npc of this.npcs) {
      if (!npc.active) continue;
      for (const drifter of this.drifters) {
        if (!drifter.active) continue;
        const dx = npc.x - drifter.x;
        const dy = npc.y - drifter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < npc.radius + drifter.radius) {
          npc.active = false;
          npc.killedByHazard = true;
          break;
        }
      }
    }
  }

  /** Enemies destroy NPCs on contact. */
  private resolveEnemyNPCCollisions(): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      for (const npc of this.npcs) {
        if (!npc.active) continue;
        const dx = enemy.x - npc.x;
        const dy = enemy.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + npc.radius) {
          npc.active = false;
          npc.killedByHazard = true;
          // Enemy survives — it hunted successfully
        }
      }
    }
  }

  /** Enemies smash through asteroids — splits/destroys on contact. */
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

  private canDropShieldAt(x: number, y: number): boolean {
    return (
      x >= ARENA_LEFT + SHIELD_PICKUP_RADIUS &&
      x <= ARENA_RIGHT - SHIELD_PICKUP_RADIUS &&
      y >= ARENA_TOP + SHIELD_PICKUP_RADIUS &&
      y <= ARENA_BOTTOM - SHIELD_PICKUP_RADIUS
    );
  }

  destroy(): void {
    for (const d of this.drifters) d.destroy();
    for (const b of this.beams) b.destroy();
    for (const e of this.enemies) e.destroy();
    for (const n of this.npcs) n.destroy();
    this.drifters = [];
    this.beams = [];
    this.enemies = [];
    this.npcs = [];
  }
}
