import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { PhaseConfig } from '../types';
import {
  ASTEROID_DESTROY_BONUS,
  ASTEROID_DESTROY_DROP_CHANCE,
  BOSS_DEFEAT_BONUS_POINTS,
  BOSS_DEFEAT_BONUS_PICKUP_COUNT,
  BOSS_SHIELD_DRIFT_SPAWN_INTERVAL_MAX_MS,
  BOSS_SHIELD_DRIFT_SPAWN_INTERVAL_MIN_MS,
  BOSS_SHIELD_DRIFT_SPEED_MAX,
  BOSS_SHIELD_DRIFT_SPEED_MIN,
  BOMB_DROP_CHANCE,
  BOSS_DRIFTER_SPAWN_RATE_MULT,
  DRIFTER_MINEABLE_CHANCE,
  DRIFTER_RARE_CHANCE,
  DRIFTER_SPEED_BASE,
  ENEMY_BONUS_POINTS,
  GUNSHIP_BOSS_DEBRIS_COUNT,
  NPC_BONUS_DROP_CHANCE,
  NPC_BONUS_POINTS,
  POST_BOSS_ENEMY_SURGE_INITIAL_COUNT,
  POST_BOSS_ENEMY_SURGE_INTERVAL_MS,
  POST_BOSS_ENEMY_SURGE_MAX_ENEMIES,
  POST_BOSS_BEAM_BURST_COUNT,
  POST_BOSS_BEAM_FREQUENCY_MULT,
  VERSUS_LASER_DROP_CHANCE_ENEMY,
  VERSUS_LASER_DROP_CHANCE_NPC,
  WORMHOLE_POCKET_COMPACT_DRIFTER_CAP_MULT,
  WORMHOLE_POCKET_COMPACT_MAX_SIZE,
  WORMHOLE_POCKET_COMPACT_SPAWN_RATE_MULT,
  WORMHOLE_POCKET_COMPACT_SPEED_MULT,
  WORMHOLE_POCKET_DRIFTER_CAP_MULT,
  WORMHOLE_POCKET_MINEABLE_CHANCE,
  WORMHOLE_POCKET_SPEED_MULT,
  WORMHOLE_POCKET_SPAWN_RATE_MULT,
  WORMHOLE_POCKET_TINY_DRIFTER_CAP_MULT,
  WORMHOLE_POCKET_TINY_MAX_SIZE,
  WORMHOLE_POCKET_TINY_SPAWN_RATE_MULT,
  WORMHOLE_POCKET_TINY_SPEED_MULT,
} from '../data/tuning';
import { getPhaseConfig, pickAsteroidSize, pickPocketAsteroidSize } from '../data/phaseConfig';
import { DrifterHazard } from '../entities/DrifterHazard';
import { BeamHazard } from '../entities/BeamHazard';
import { EnemyShip } from '../entities/EnemyShip';
import { NPCShip } from '../entities/NPCShip';
import { SHIELD_PICKUP_RADIUS } from '../entities/ShieldPickup';
import { ShipDebris } from '../entities/ShipDebris';
import { GunshipBoss } from '../entities/GunshipBoss';
import { SlagHauler } from '../entities/SlagHauler';
import { SingularityBoss } from '../entities/SingularityBoss';
import { BeamLatticeBoss } from '../entities/BeamLatticeBoss';
import type { BossEntity } from '../entities/BossEntity';
import {
  BOSS_BEAM_BURST_COUNT,
  BOSS_BEAM_FREQUENCY_MULT,
  BOSS_SPAWN_WEIGHT_GUNSHIP,
  BOSS_SPAWN_WEIGHT_HAULER,
  BOSS_SPAWN_WEIGHT_SINGULARITY,
} from '../data/tuning';
import { Overlays } from '../ui/Overlays';
import { getLayout, getArenaDensityScale, isNarrowViewport, isShortViewport } from '../layout';
import { playSfx } from './SfxSystem';

interface BossEvents {
  spawned: boolean;
  coreExposed: boolean;
  destroyed: boolean;
}

interface PocketScreenTuning {
  capMult: number;
  spawnRateMult: number;
  speedMult: number;
  maxAsteroidSize: number;
}

export class DifficultySystem {
  private scene: Phaser.Scene;
  private config: PhaseConfig;
  private drifters: DrifterHazard[] = [];
  private beams: BeamHazard[] = [];
  private enemies: EnemyShip[] = [];
  private npcs: NPCShip[] = [];
  private shieldDropPositions: { x: number; y: number; vx: number; vy: number }[] = [];
  private bonusDropPositions: { x: number; y: number; vx: number; vy: number; points: number; miningBonus?: boolean }[] = [];
  private bombDropPositions: { x: number; y: number; vx: number; vy: number }[] = [];
  private versusLaserDropPositions: { x: number; y: number; vx: number; vy: number }[] = [];
  private versusLasersEnabled = false;
  private shipDebris: ShipDebris[] = [];
  private boss: BossEntity | null = null;
  private bossDefeated = false;
  private bossEvents: BossEvents = { spawned: false, coreExposed: false, destroyed: false };
  private postBossSurgeActive = false;
  private postBossSurgeTimerMs = 0;
  private scaledMaxDrifters = 0;
  private scaledMaxEnemies = 0;
  private scaledMaxNPCs = 0;
  private scaledSpawnMult = 1;
  private drifterTimer = 0;
  private beamTimer = 0;
  private beamBurstQueue = 0;
  private beamBurstTimer = 0;
  private enemyTimer = 0;
  private npcTimer = 0;
  private bonusDropChanceAdd = 0.0;
  private asteroidCollisionSfxCooldownMs = 0;
  private bossShieldDriftTimerMs = 0;
  private nextBossShieldDriftSpawnMs = 0;
  private pocketActive = false;

  constructor(scene: Phaser.Scene, phase: number) {
    this.scene = scene;
    this.config = getPhaseConfig(phase);
    this.updateDensityScale();
    this.resetBossShieldDriftTimer();
  }

  setBoosts(bonusDropChanceAdd: number): void {
    this.bonusDropChanceAdd = bonusDropChanceAdd;
  }

  setPocketActive(active: boolean): void {
    this.pocketActive = active;
    if (active) {
      this.beamTimer = 0;
      this.beamBurstQueue = 0;
      this.beamBurstTimer = 0;
      this.enemyTimer = 0;
      this.npcTimer = 0;
    }
  }

  isPocketActive(): boolean {
    return this.pocketActive;
  }

  setPhase(phase: number): void {
    const wasBossPhase = this.config.bossEnabled;
    this.config = getPhaseConfig(phase);
    this.updateDensityScale();
    if (!wasBossPhase && this.config.bossEnabled) {
      this.clearCombatThreats();
    }
  }

  private updateDensityScale(): void {
    const scale = getArenaDensityScale();
    this.scaledMaxDrifters = Math.max(6, Math.round(this.config.maxConcurrentDrifters * scale));
    this.scaledMaxEnemies = Math.max(this.config.maxConcurrentEnemies, Math.round(this.config.maxConcurrentEnemies * scale));
    this.scaledMaxNPCs = Math.max(this.config.maxConcurrentNPCs, Math.round(this.config.maxConcurrentNPCs * scale));
    // Bigger screens spawn faster to fill the space; small screens get a breather
    this.scaledSpawnMult = scale >= 1 ? 1 / scale : 1 / Math.pow(scale, 0.5);
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

  getBoss(): BossEntity | null {
    return this.boss;
  }

  consumeShieldDrops(): { x: number; y: number; vx: number; vy: number }[] {
    const drops = this.shieldDropPositions;
    this.shieldDropPositions = [];
    return drops;
  }

  consumeBonusDrops(): { x: number; y: number; vx: number; vy: number; points: number; miningBonus?: boolean }[] {
    const drops = this.bonusDropPositions;
    this.bonusDropPositions = [];
    return drops;
  }

  consumeBombDrops(): { x: number; y: number; vx: number; vy: number }[] {
    const drops = this.bombDropPositions;
    this.bombDropPositions = [];
    return drops;
  }

  consumeVersusLaserDrops(): { x: number; y: number; vx: number; vy: number }[] {
    const drops = this.versusLaserDropPositions;
    this.versusLaserDropPositions = [];
    return drops;
  }

  setVersusLasersEnabled(enabled: boolean): void {
    this.versusLasersEnabled = enabled;
  }

  consumeBossEvents(): BossEvents {
    const events = { ...this.bossEvents };
    this.bossEvents = { spawned: false, coreExposed: false, destroyed: false };
    return events;
  }

  checkBossBeamHit(targetX: number, targetY: number, targetRadius: number): boolean {
    return this.boss?.checkBeamHit(targetX, targetY, targetRadius) ?? false;
  }

  getBossHardpointCollisionIndex(targetX: number, targetY: number, targetRadius: number): number | null {
    return this.boss?.getCollidingHardpointIndex(targetX, targetY, targetRadius) ?? null;
  }

  destroyBossHardpoint(index: number): boolean {
    if (!this.boss) {
      return false;
    }

    const drop = this.boss.destroyHardpoint(index);
    if (!drop) {
      return false;
    }

    this.shipDebris.push(new ShipDebris(this.scene, drop.x, drop.y, drop.vx, drop.vy, COLORS.ENEMY, 16));

    if (this.boss.isCoreExposed()) {
      this.bossEvents.coreExposed = true;
    }

    return true;
  }

  checkBossCoreContact(targetX: number, targetY: number, targetRadius: number): boolean {
    return this.boss?.checkCoreContact(targetX, targetY, targetRadius) ?? false;
  }

  updateBossCoreBreach(targetX: number, targetY: number, targetRadius: number, hasShield: boolean): boolean {
    if (!this.boss) {
      return false;
    }

    const destroyed = this.boss.updateCoreBreach(targetX, targetY, targetRadius, hasShield);
    if (destroyed) {
      this.handleBossDestroyed();
      return true;
    }

    return false;
  }

  clearBoss(): void {
    if (!this.boss) {
      return;
    }

    this.boss.destroy();
    this.boss = null;
    this.resetBossShieldDriftTimer();
  }

  debugSetPhase(phase: number): void {
    const targetPhase = Math.max(1, Math.floor(phase));

    this.clearCombatThreats();
    this.clearBoss();
    for (const sd of this.shipDebris) {
      sd.destroy();
    }
    this.shipDebris = [];
    this.shieldDropPositions = [];
    this.bonusDropPositions = [];
    this.bombDropPositions = [];
    this.versusLaserDropPositions = [];
    this.bossDefeated = false;
    this.bossEvents = { spawned: false, coreExposed: false, destroyed: false };
    this.postBossSurgeActive = false;
    this.postBossSurgeTimerMs = 0;
    this.pocketActive = false;
    this.drifterTimer = 0;
    this.beamTimer = 0;
    this.beamBurstQueue = 0;
    this.beamBurstTimer = 0;
    this.enemyTimer = 0;
    this.npcTimer = 0;
    this.config = getPhaseConfig(targetPhase);
    this.updateDensityScale();

    if (this.config.bossEnabled) {
      this.spawnBoss();
    }
  }

  update(delta: number, playerX = 0, playerY = 0): void {
    const activeConfig = this.getActiveConfig();
    const activeScaledMaxDrifters = this.getActiveScaledMaxDrifters();

    if (activeConfig.bossEnabled && !this.boss && !this.bossDefeated) {
      this.spawnBoss();
    }

    this.asteroidCollisionSfxCooldownMs = Math.max(0, this.asteroidCollisionSfxCooldownMs - delta);
    this.drifterTimer += delta;
    const bossDrifterRateMult = this.boss ? BOSS_DRIFTER_SPAWN_RATE_MULT : 1;
    if (this.drifterTimer >= activeConfig.hazardSpawnRate * this.scaledSpawnMult * bossDrifterRateMult && this.drifters.length < activeScaledMaxDrifters) {
      const speed = DRIFTER_SPEED_BASE * activeConfig.hazardSpeedMultiplier;
      const pocketTuning = this.pocketActive ? this.getPocketScreenTuning() : null;
      const sizeScale = pocketTuning ? pickPocketAsteroidSize(pocketTuning.maxAsteroidSize) : pickAsteroidSize(activeConfig.phaseNumber);
      const adjustedSpeed = speed * (1 / Math.sqrt(sizeScale)) * (pocketTuning?.speedMult ?? 1);
      const isMineable = Math.random() < (this.pocketActive ? WORMHOLE_POCKET_MINEABLE_CHANCE : DRIFTER_MINEABLE_CHANCE);
      const isRare = isMineable && sizeScale >= 1.5 && Math.random() < DRIFTER_RARE_CHANCE;
      this.drifters.push(new DrifterHazard(this.scene, adjustedSpeed, sizeScale, isMineable, isRare));
      this.drifterTimer = 0;
    }

    if (activeConfig.beamEnabled) {
      this.beamTimer += delta;
      if (this.beamTimer >= activeConfig.beamFrequency && this.beamBurstQueue === 0) {
        Overlays.beamWarningFlash(this.scene);
        // First beam fires immediately, rest queued as rapid burst
        this.beams.push(new BeamHazard(this.scene, activeConfig.beamWidth));
        this.beamBurstQueue = activeConfig.beamBurstCount - 1;
        this.beamBurstTimer = 0;
        this.beamTimer = 0;
      }
      // Rapid-fire burst: spawn queued beams with short delays
      if (this.beamBurstQueue > 0) {
        this.beamBurstTimer += delta;
        if (this.beamBurstTimer >= activeConfig.beamBurstDelay) {
          this.beams.push(new BeamHazard(this.scene, activeConfig.beamWidth));
          this.beamBurstQueue--;
          this.beamBurstTimer -= activeConfig.beamBurstDelay;
        }
      }
    }

    if (activeConfig.enemyEnabled && !activeConfig.bossEnabled) {
      this.enemyTimer += delta;
      if (this.enemyTimer >= activeConfig.enemySpawnRate * this.scaledSpawnMult && this.enemies.length < this.scaledMaxEnemies) {
        this.enemies.push(new EnemyShip(this.scene));
        this.enemyTimer = 0;
      }
    }
    this.updatePostBossSurge(delta);

    if (activeConfig.npcEnabled) {
      this.npcTimer += delta;
      if (this.npcTimer >= activeConfig.npcSpawnRate * this.scaledSpawnMult && this.npcs.length < this.scaledMaxNPCs) {
        this.npcs.push(new NPCShip(this.scene));
        this.npcTimer = 0;
      }
    }

    this.boss?.update(delta);
    this.updateBossShieldDrift(delta);
    if (this.boss?.consumeWarningPulse()) {
      Overlays.beamWarningFlash(this.scene);
    }
    if (this.boss) {
      const vents = this.boss.consumeAsteroidVents();
      const overflowCap = activeScaledMaxDrifters + 8;
      for (const v of vents) {
        if (this.drifters.length >= overflowCap) break;
        this.drifters.push(DrifterHazard.createFragment(this.scene, v.x, v.y, v.vx, v.vy, v.sizeScale, v.mineable));
      }
    }
    this.applyBossForceToDrifters(delta);
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
    // EXPERIMENT: asteroid-vs-asteroid collisions disabled. Flip to true to restore.
    if (false as boolean) this.resolveDrifterCollisions();
    this.resolveBeamEntityCollisions();
    this.resolveBossBeamEntityCollisions();

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
          this.shipDebris.push(new ShipDebris(this.scene, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), COLORS.ENEMY, enemy.radius));
          this.bonusDropPositions.push({
            x: enemy.x,
            y: enemy.y,
            vx: enemy.getVelocityX() * 0.45,
            vy: enemy.getVelocityY() * 0.45,
            points: ENEMY_BONUS_POINTS,
          });
          if (Math.random() < BOMB_DROP_CHANCE + this.bonusDropChanceAdd) {
            this.bombDropPositions.push({
              x: enemy.x,
              y: enemy.y,
              vx: enemy.getVelocityX() * 0.3,
              vy: enemy.getVelocityY() * 0.3,
            });
          }
          if (this.versusLasersEnabled && Math.random() < VERSUS_LASER_DROP_CHANCE_ENEMY) {
            this.versusLaserDropPositions.push({
              x: enemy.x,
              y: enemy.y,
              vx: enemy.getVelocityX() * 0.3,
              vy: enemy.getVelocityY() * 0.3,
            });
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
          this.shipDebris.push(new ShipDebris(this.scene, npc.x, npc.y, npc.vx, npc.vy, npc.getHullColor(), npc.radius));
          if (this.canDropShieldAt(npc.x, npc.y)) {
            this.shieldDropPositions.push({ x: npc.x, y: npc.y, vx: npc.vx, vy: npc.vy });
          }
          if (Math.random() < NPC_BONUS_DROP_CHANCE + this.bonusDropChanceAdd) {
            this.bonusDropPositions.push({
              x: npc.x,
              y: npc.y,
              vx: npc.vx * 0.5,
              vy: npc.vy * 0.5,
              points: NPC_BONUS_POINTS,
            });
          }
          if (this.versusLasersEnabled && Math.random() < VERSUS_LASER_DROP_CHANCE_NPC) {
            this.versusLaserDropPositions.push({
              x: npc.x,
              y: npc.y,
              vx: npc.vx * 0.5,
              vy: npc.vy * 0.5,
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
    this.boss?.update(delta);
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
    } else if (Math.random() < ASTEROID_DESTROY_DROP_CHANCE) {
      // Too small to split — chance to drop a small mining bonus
      this.bonusDropPositions.push({
        x: target.x, y: target.y,
        vx: target.vx * 0.5, vy: target.vy * 0.5,
        points: ASTEROID_DESTROY_BONUS,
        miningBonus: true,
      });
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
            if (this.asteroidCollisionSfxCooldownMs <= 0) {
              playSfx(this.scene, 'asteroidCollision', { volumeScale: 0.9 });
              this.asteroidCollisionSfxCooldownMs = 90;
            }
            const impulse = (2 * relDotN) / (massA + massB);
            a.vx -= impulse * massB * nx;
            a.vy -= impulse * massB * ny;
            b.vx += impulse * massA * nx;
            b.vy += impulse * massA * ny;

            a.bounceCount++;
            b.bounceCount++;

            // Only the smaller splits; equal size picks one at random (max 2 fragments per collision)
            const victims = a.radiusScale < b.radiusScale
              ? [a]
              : b.radiusScale < a.radiusScale
                ? [b]
                : [Math.random() < 0.5 ? a : b];

            for (const ast of victims) {
              if (!ast.active) continue;
              const childScale = ast.radiusScale * 0.55;
              const canSplit = childScale >= DrifterHazard.MIN_SPLIT_SCALE &&
                this.drifters.length + newFragments.length < this.scaledMaxDrifters + 8;

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
                this.shipDebris.push(new ShipDebris(this.scene, ast.x, ast.y, ast.vx, ast.vy, COLORS.ASTEROID, ast.radius));
                // Too small to split — chance to drop a small mining bonus
                if (Math.random() < ASTEROID_DESTROY_DROP_CHANCE) {
                  this.bonusDropPositions.push({
                    x: ast.x, y: ast.y,
                    vx: ast.vx * 0.5, vy: ast.vy * 0.5,
                    points: ASTEROID_DESTROY_BONUS,
                    miningBonus: true,
                  });
                }
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
          this.shipDebris.push(new ShipDebris(this.scene, drifter.x, drifter.y, drifter.vx, drifter.vy, COLORS.ASTEROID, drifter.radius));
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
          this.shipDebris.push(new ShipDebris(this.scene, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), COLORS.ENEMY, enemy.radius));
          this.bonusDropPositions.push({
            x: enemy.x, y: enemy.y,
            vx: enemy.getVelocityX() * 0.45, vy: enemy.getVelocityY() * 0.45,
            points: ENEMY_BONUS_POINTS,
          });
          if (Math.random() < BOMB_DROP_CHANCE + this.bonusDropChanceAdd) {
            this.bombDropPositions.push({
              x: enemy.x, y: enemy.y,
              vx: enemy.getVelocityX() * 0.3, vy: enemy.getVelocityY() * 0.3,
            });
          }
          if (this.versusLasersEnabled && Math.random() < VERSUS_LASER_DROP_CHANCE_ENEMY) {
            this.versusLaserDropPositions.push({
              x: enemy.x, y: enemy.y,
              vx: enemy.getVelocityX() * 0.3, vy: enemy.getVelocityY() * 0.3,
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

  private resolveBossBeamEntityCollisions(): void {
    if (!this.boss) {
      return;
    }

    for (const drifter of this.drifters) {
      if (!drifter.active) continue;
      if (this.boss.checkBeamHit(drifter.x, drifter.y, drifter.radius)) {
        drifter.active = false;
        this.shipDebris.push(new ShipDebris(this.scene, drifter.x, drifter.y, drifter.vx, drifter.vy, COLORS.ASTEROID, drifter.radius));
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (this.boss.checkBeamHit(enemy.x, enemy.y, enemy.radius)) {
        enemy.active = false;
        this.shipDebris.push(new ShipDebris(this.scene, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), COLORS.ENEMY, enemy.radius));
        this.bonusDropPositions.push({
          x: enemy.x,
          y: enemy.y,
          vx: enemy.getVelocityX() * 0.45,
          vy: enemy.getVelocityY() * 0.45,
          points: ENEMY_BONUS_POINTS,
        });
        if (Math.random() < BOMB_DROP_CHANCE + this.bonusDropChanceAdd) {
          this.bombDropPositions.push({
            x: enemy.x,
            y: enemy.y,
            vx: enemy.getVelocityX() * 0.3,
            vy: enemy.getVelocityY() * 0.3,
          });
        }
        if (this.versusLasersEnabled && Math.random() < VERSUS_LASER_DROP_CHANCE_ENEMY) {
          this.versusLaserDropPositions.push({
            x: enemy.x,
            y: enemy.y,
            vx: enemy.getVelocityX() * 0.3,
            vy: enemy.getVelocityY() * 0.3,
          });
        }
      }
    }

    for (const npc of this.npcs) {
      if (!npc.active) continue;
      if (this.boss.checkBeamHit(npc.x, npc.y, npc.radius)) {
        npc.active = false;
        npc.killedByHazard = true;
      }
    }
  }

  private spawnBoss(): void {
    this.clearCombatThreats();
    this.boss = this.pickBoss();
    this.resetBossShieldDriftTimer();
    this.bossEvents.spawned = true;
  }

  private pickBoss(): BossEntity {
    const roll = Math.random();
    let acc = BOSS_SPAWN_WEIGHT_GUNSHIP;
    if (roll < acc) return new GunshipBoss(this.scene);
    acc += BOSS_SPAWN_WEIGHT_HAULER;
    if (roll < acc) return new SlagHauler(this.scene);
    acc += BOSS_SPAWN_WEIGHT_SINGULARITY;
    if (roll < acc) return new SingularityBoss(this.scene);
    return new BeamLatticeBoss(this.scene);
  }

  private applyBossForceToDrifters(delta: number): void {
    if (!this.boss?.getForceField) return;
    const dt = delta / 1000;
    for (const d of this.drifters) {
      if (!d.active) continue;
      const force = this.boss.getForceField(d.x, d.y, delta);
      const ix = force.ax * dt + force.ix;
      const iy = force.ay * dt + force.iy;
      if (ix === 0 && iy === 0) continue;
      d.vx += ix;
      d.vy += iy;
    }
  }

  private clearCombatThreats(): void {
    for (const beam of this.beams) {
      beam.destroy();
    }
    this.beams = [];
    this.beamTimer = 0;
    this.beamBurstQueue = 0;
    this.beamBurstTimer = 0;

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.enemyTimer = 0;
  }

  private handleBossDestroyed(): void {
    if (!this.boss) {
      return;
    }

    const boss = this.boss;
    const { center, inward, tangent } = boss.getDestructionPlan();
    const layout = getLayout();

    this.shipDebris.push(new ShipDebris(this.scene, center.x, center.y, inward.x * 90, inward.y * 90, COLORS.ENEMY, 42));
    const baseReward = Math.floor(BOSS_DEFEAT_BONUS_POINTS / BOSS_DEFEAT_BONUS_PICKUP_COUNT);
    let remainingReward = BOSS_DEFEAT_BONUS_POINTS;
    for (let i = 0; i < BOSS_DEFEAT_BONUS_PICKUP_COUNT; i++) {
      const points = i === BOSS_DEFEAT_BONUS_PICKUP_COUNT - 1 ? remainingReward : baseReward;
      remainingReward -= points;
      const angle = (i / BOSS_DEFEAT_BONUS_PICKUP_COUNT) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.16, 0.16);
      const offset = Phaser.Math.FloatBetween(8, 48);
      const speed = Phaser.Math.FloatBetween(18, 55);
      const x = Phaser.Math.Clamp(center.x + Math.cos(angle) * offset, layout.arenaLeft + 24, layout.arenaRight - 24);
      const y = Phaser.Math.Clamp(center.y + Math.sin(angle) * offset, layout.arenaTop + 24, layout.arenaBottom - 24);
      this.bonusDropPositions.push({
        x,
        y,
        vx: Math.cos(angle) * speed + inward.x * 14,
        vy: Math.sin(angle) * speed + inward.y * 14,
        points,
      });
    }

    for (let i = 0; i < GUNSHIP_BOSS_DEBRIS_COUNT; i++) {
      const forwardSpeed = Phaser.Math.FloatBetween(95, 215);
      const lateralSpeed = Phaser.Math.FloatBetween(-145, 145);
      const spawnX = Phaser.Math.Clamp(
        center.x + tangent.x * Phaser.Math.FloatBetween(-88, 88) + inward.x * Phaser.Math.FloatBetween(18, 42),
        layout.arenaLeft + 22,
        layout.arenaRight - 22,
      );
      const spawnY = Phaser.Math.Clamp(
        center.y + tangent.y * Phaser.Math.FloatBetween(-88, 88) + inward.y * Phaser.Math.FloatBetween(18, 42),
        layout.arenaTop + 22,
        layout.arenaBottom - 22,
      );
      const vx = inward.x * forwardSpeed + tangent.x * lateralSpeed;
      const vy = inward.y * forwardSpeed + tangent.y * lateralSpeed;
      const radiusScale = Phaser.Math.FloatBetween(0.75, 1.2);
      this.drifters.push(DrifterHazard.createFragment(this.scene, spawnX, spawnY, vx, vy, radiusScale, false));
      this.shipDebris.push(new ShipDebris(this.scene, spawnX, spawnY, vx * 0.65, vy * 0.65, COLORS.ENEMY, 18));
    }

    boss.destroy();
    this.boss = null;
    this.bossDefeated = true;
    this.postBossSurgeActive = false;
    this.postBossSurgeTimerMs = 0;
    this.resetBossShieldDriftTimer();
    this.bossEvents.destroyed = true;
  }

  startPostBossEscapeSurge(): void {
    this.postBossSurgeActive = true;
    this.postBossSurgeTimerMs = 0;
    for (let i = 0; i < POST_BOSS_ENEMY_SURGE_INITIAL_COUNT; i++) {
      this.enemies.push(new EnemyShip(this.scene));
    }
  }

  private updatePostBossSurge(delta: number): void {
    if (!this.postBossSurgeActive || this.pocketActive) {
      return;
    }

    this.postBossSurgeTimerMs += delta;
    while (
      this.postBossSurgeTimerMs >= POST_BOSS_ENEMY_SURGE_INTERVAL_MS &&
      this.enemies.length < POST_BOSS_ENEMY_SURGE_MAX_ENEMIES
    ) {
      this.postBossSurgeTimerMs -= POST_BOSS_ENEMY_SURGE_INTERVAL_MS;
      this.enemies.push(new EnemyShip(this.scene));
    }
  }

  private updateBossShieldDrift(delta: number): void {
    if (!this.boss || this.pocketActive) {
      return;
    }

    this.bossShieldDriftTimerMs += delta;
    if (this.bossShieldDriftTimerMs < this.nextBossShieldDriftSpawnMs) {
      return;
    }

    this.spawnBossShieldDriftIn();
    this.resetBossShieldDriftTimer();
  }

  private resetBossShieldDriftTimer(): void {
    this.bossShieldDriftTimerMs = 0;
    this.nextBossShieldDriftSpawnMs = Phaser.Math.Between(
      BOSS_SHIELD_DRIFT_SPAWN_INTERVAL_MIN_MS,
      BOSS_SHIELD_DRIFT_SPAWN_INTERVAL_MAX_MS,
    );
  }

  private spawnBossShieldDriftIn(): void {
    const layout = getLayout();
    const margin = SHIELD_PICKUP_RADIUS + 18;
    const targetX = Phaser.Math.FloatBetween(
      layout.arenaLeft + layout.arenaWidth * 0.22,
      layout.arenaRight - layout.arenaWidth * 0.22,
    );
    const targetY = Phaser.Math.FloatBetween(
      layout.arenaTop + layout.arenaHeight * 0.22,
      layout.arenaBottom - layout.arenaHeight * 0.22,
    );

    let spawnX = targetX;
    let spawnY = targetY;
    switch (Phaser.Math.Between(0, 3)) {
      case 0:
        spawnX = Phaser.Math.FloatBetween(layout.arenaLeft + margin, layout.arenaRight - margin);
        spawnY = layout.arenaTop - margin;
        break;
      case 1:
        spawnX = Phaser.Math.FloatBetween(layout.arenaLeft + margin, layout.arenaRight - margin);
        spawnY = layout.arenaBottom + margin;
        break;
      case 2:
        spawnX = layout.arenaLeft - margin;
        spawnY = Phaser.Math.FloatBetween(layout.arenaTop + margin, layout.arenaBottom - margin);
        break;
      default:
        spawnX = layout.arenaRight + margin;
        spawnY = Phaser.Math.FloatBetween(layout.arenaTop + margin, layout.arenaBottom - margin);
        break;
    }

    const angle = Math.atan2(targetY - spawnY, targetX - spawnX);
    const speed = Phaser.Math.FloatBetween(BOSS_SHIELD_DRIFT_SPEED_MIN, BOSS_SHIELD_DRIFT_SPEED_MAX);
    this.shieldDropPositions.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }

  private getActiveConfig(): PhaseConfig {
    if (!this.pocketActive) {
      if (this.postBossSurgeActive && this.config.beamEnabled) {
        return {
          ...this.config,
          beamFrequency: this.config.beamFrequency * POST_BOSS_BEAM_FREQUENCY_MULT,
          beamBurstCount: POST_BOSS_BEAM_BURST_COUNT,
        };
      }
      if (this.boss && this.config.beamEnabled) {
        return {
          ...this.config,
          beamFrequency: this.config.beamFrequency * BOSS_BEAM_FREQUENCY_MULT,
          beamBurstCount: BOSS_BEAM_BURST_COUNT,
        };
      }
      return this.config;
    }

    const pocketTuning = this.getPocketScreenTuning();
    return {
      ...this.config,
      hazardSpawnRate: this.config.hazardSpawnRate * pocketTuning.spawnRateMult,
      maxConcurrentDrifters: Math.max(
        this.config.maxConcurrentDrifters + 4,
        Math.round(this.config.maxConcurrentDrifters * pocketTuning.capMult),
      ),
      beamEnabled: false,
      beamFrequency: 0,
      beamBurstCount: 0,
      beamBurstDelay: 0,
      enemyEnabled: false,
      enemySpawnRate: 0,
      maxConcurrentEnemies: 0,
      npcEnabled: false,
      npcSpawnRate: 0,
      maxConcurrentNPCs: 0,
      bossEnabled: false,
    };
  }

  private getActiveScaledMaxDrifters(): number {
    if (!this.pocketActive) {
      return this.scaledMaxDrifters;
    }

    const pocketTuning = this.getPocketScreenTuning();
    return Math.max(
      this.scaledMaxDrifters + (pocketTuning.capMult < WORMHOLE_POCKET_DRIFTER_CAP_MULT ? 3 : 6),
      Math.round(this.scaledMaxDrifters * pocketTuning.capMult),
    );
  }

  private getPocketScreenTuning(): PocketScreenTuning {
    const layout = getLayout();
    const narrow = isNarrowViewport(layout);
    const short = isShortViewport(layout);

    if (narrow && short) {
      return {
        capMult: WORMHOLE_POCKET_TINY_DRIFTER_CAP_MULT,
        spawnRateMult: WORMHOLE_POCKET_TINY_SPAWN_RATE_MULT,
        speedMult: WORMHOLE_POCKET_TINY_SPEED_MULT,
        maxAsteroidSize: WORMHOLE_POCKET_TINY_MAX_SIZE,
      };
    }

    if (narrow || short) {
      return {
        capMult: WORMHOLE_POCKET_COMPACT_DRIFTER_CAP_MULT,
        spawnRateMult: WORMHOLE_POCKET_COMPACT_SPAWN_RATE_MULT,
        speedMult: WORMHOLE_POCKET_COMPACT_SPEED_MULT,
        maxAsteroidSize: WORMHOLE_POCKET_COMPACT_MAX_SIZE,
      };
    }

    return {
      capMult: WORMHOLE_POCKET_DRIFTER_CAP_MULT,
      spawnRateMult: WORMHOLE_POCKET_SPAWN_RATE_MULT,
      speedMult: WORMHOLE_POCKET_SPEED_MULT,
      maxAsteroidSize: Number.POSITIVE_INFINITY,
    };
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

  destroy(): void {
    for (const d of this.drifters) d.destroy();
    for (const b of this.beams) b.destroy();
    for (const e of this.enemies) e.destroy();
    for (const n of this.npcs) n.destroy();
    for (const sd of this.shipDebris) sd.destroy();
    this.boss?.destroy();
    this.drifters = [];
    this.beams = [];
    this.enemies = [];
    this.npcs = [];
    this.shipDebris = [];
    this.boss = null;
    this.shieldDropPositions = [];
    this.bonusDropPositions = [];
    this.bombDropPositions = [];
    this.versusLaserDropPositions = [];
    this.bossEvents = { spawned: false, coreExposed: false, destroyed: false };
  }
}
